import type { NextAuthConfig } from "next-auth";

const secure = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure,
};

export const authConfig = {
  pages: {
    signIn: "/console/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "r9host.console.session-token",
      options: cookieOptions,
    },
    callbackUrl: {
      name: "r9host.console.callback-url",
      options: { ...cookieOptions, httpOnly: false },
    },
    csrfToken: {
      name: "r9host.console.csrf-token",
      options: { ...cookieOptions, httpOnly: false },
    },
    pkceCodeVerifier: {
      name: "r9host.console.pkce.code_verifier",
      options: { ...cookieOptions, maxAge: 60 * 15 },
    },
    state: {
      name: "r9host.console.state",
      options: { ...cookieOptions, maxAge: 60 * 15 },
    },
    nonce: {
      name: "r9host.console.nonce",
      options: { ...cookieOptions, maxAge: 60 * 15 },
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
