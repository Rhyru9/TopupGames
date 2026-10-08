import type { NextAuthConfig } from "next-auth";

const secure = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure,
};

export const memberAuthConfig = {
  pages: {
    signIn: "/masuk",
    error: "/masuk",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "MEMBER";
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "MEMBER";
        if (token.name) session.user.name = token.name as string;
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "r9host.member.session-token",
      options: cookieOptions,
    },
    callbackUrl: {
      name: "r9host.member.callback-url",
      options: { ...cookieOptions, httpOnly: false },
    },
    csrfToken: {
      name: "r9host.member.csrf-token",
      options: { ...cookieOptions, httpOnly: false },
    },
    pkceCodeVerifier: {
      name: "r9host.member.pkce.code_verifier",
      options: { ...cookieOptions, maxAge: 60 * 15 },
    },
    state: {
      name: "r9host.member.state",
      options: { ...cookieOptions, maxAge: 60 * 15 },
    },
    nonce: {
      name: "r9host.member.nonce",
      options: { ...cookieOptions, maxAge: 60 * 15 },
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
