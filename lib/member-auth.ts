import { MemberStatus } from "@/app/generated/prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { memberAuthConfig } from "@/lib/member-auth.config";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import { allocateMemberCode } from "@/lib/member/member-code";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { isGoogleLoginConfigured } from "@/lib/site-settings/site-settings-schemas";

export const MEMBER_GOOGLE_INTENT_COOKIE = "r9host.member.oauth.intent";
export const MEMBER_GOOGLE_NEXT_COOKIE = "r9host.member.oauth.next";

export type MemberGoogleIntent = "login" | "register";

async function consumeGoogleOAuthContext(): Promise<{
  intent: MemberGoogleIntent;
  next: string;
}> {
  const jar = await cookies();
  const rawIntent = jar.get(MEMBER_GOOGLE_INTENT_COOKIE)?.value;
  const rawNext = jar.get(MEMBER_GOOGLE_NEXT_COOKIE)?.value ?? "/member";
  jar.delete(MEMBER_GOOGLE_INTENT_COOKIE);
  jar.delete(MEMBER_GOOGLE_NEXT_COOKIE);
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/member";
  return {
    intent: rawIntent === "register" ? "register" : "login",
    next,
  };
}

async function findMemberForGoogle(email: string, googleId: string) {
  const byGoogle = await prisma.member.findUnique({ where: { googleId } });
  if (byGoogle) return byGoogle;
  return prisma.member.findUnique({ where: { email } });
}

async function attachGoogleToMember(
  memberId: string,
  input: { email: string; name: string; image?: string | null; googleId: string },
) {
  const member = await prisma.member.update({
    where: { id: memberId },
    data: {
      googleId: input.googleId,
      email: input.email,
      name: input.name || undefined,
      image: input.image ?? undefined,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  await getOrCreateMemberBalance(member.id);
  return member;
}

async function createGoogleMember(input: {
  email: string;
  name: string;
  image?: string | null;
  googleId: string;
}) {
  const member = await prisma.member.create({
    data: {
      memberCode: await allocateMemberCode(),
      email: input.email,
      name: input.name || "Member",
      image: input.image ?? null,
      googleId: input.googleId,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  await getOrCreateMemberBalance(member.id);
  return member;
}

export const {
  handlers: memberAuthHandlers,
  auth: memberAuth,
  signIn: memberSignIn,
  signOut: memberSignOut,
} = NextAuth(async () => {
  const settings = await getSiteSettings();
  const providers: Provider[] = [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        const member = await prisma.member.findUnique({ where: { email } });
        if (
          !member ||
          !member.isActive ||
          member.status !== MemberStatus.ACTIVE ||
          !member.passwordHash
        ) {
          return null;
        }

        const valid = await bcrypt.compare(password, member.passwordHash);
        if (!valid) return null;

        await prisma.member.update({
          where: { id: member.id },
          data: { lastLoginAt: new Date() },
        });
        await getOrCreateMemberBalance(member.id);

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          image: member.image,
          role: "MEMBER",
        };
      },
    }),
  ];

  if (isGoogleLoginConfigured(settings.auth)) {
    providers.push(
      Google({
        clientId: settings.auth.googleClientId,
        clientSecret: settings.auth.googleClientSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return {
    ...memberAuthConfig,
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    basePath: "/api/member-auth",
    pages: {
      ...memberAuthConfig.pages,
      error: "/masuk",
    },
    providers,
    callbacks: {
      ...memberAuthConfig.callbacks,
      async signIn({ user, account, profile }) {
        if (account?.provider !== "google") return true;

        const email = user.email?.trim().toLowerCase();
        const googleId = account.providerAccountId;
        if (!email || !googleId) return false;

        const { intent, next } = await consumeGoogleOAuthContext();
        const name = user.name || (profile as { name?: string } | undefined)?.name || "Member";
        const existing = await findMemberForGoogle(email, googleId);

        if (intent === "login") {
          if (!existing || !existing.isActive || existing.status !== MemberStatus.ACTIVE) {
            return `/masuk?error=google_unregistered&next=${encodeURIComponent(next)}`;
          }
          const member = await attachGoogleToMember(existing.id, {
            email,
            name,
            image: user.image,
            googleId,
          });
          user.id = member.id;
          user.role = "MEMBER";
          user.name = member.name;
          user.image = member.image;
          return true;
        }

        // register: create only if email/google belum ada
        if (existing) {
          if (!existing.isActive || existing.status !== MemberStatus.ACTIVE) return false;
          const member = await attachGoogleToMember(existing.id, {
            email,
            name,
            image: user.image,
            googleId,
          });
          user.id = member.id;
          user.role = "MEMBER";
          user.name = member.name;
          user.image = member.image;
          return true;
        }

        const member = await createGoogleMember({
          email,
          name,
          image: user.image,
          googleId,
        });
        user.id = member.id;
        user.role = "MEMBER";
        user.name = member.name;
        user.image = member.image;
        return true;
      },
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role ?? "MEMBER";
          token.name = user.name;
          token.picture = user.image;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = (token.role as string) || "MEMBER";
          if (token.name) session.user.name = token.name as string;
          session.user.image = (token.picture as string | null | undefined) ?? null;
        }
        return session;
      },
    },
  };
});

export async function getMemberSession() {
  try {
    const session = await memberAuth();
    if (!session?.user?.id || session.user.role !== "MEMBER") return null;

    const member = await prisma.member.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, status: true },
    });
    if (!member || !member.isActive || member.status !== MemberStatus.ACTIVE) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("[member-auth] getMemberSession", error);
    return null;
  }
}
