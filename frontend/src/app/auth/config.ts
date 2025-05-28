import NextAuth from "next-auth";

type NextAuthConfig = Parameters<typeof NextAuth>[0];
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Google from "next-auth/providers/google";

const prisma = new PrismaClient();

type JWT = {
  id?: string;
  accessToken?: string;
  [key: string]: unknown;
};

type Session = {
  user: {
    id?: string;
    [key: string]: unknown;
  };
  accessToken?: string;
  [key: string]: unknown;
};

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    signOut: "/auth/signout",
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Send properties to the client, like an access_token from a provider.
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
