import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '@/config';
const { API_URL } = config;

console.log('Configuración de autenticación:');
console.log('API_URL:', API_URL);

const prisma = new PrismaClient();

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials as { email: string; password: string };
          
          if (!email || !password) {
            throw new Error('Email y contraseña son requeridos');
          }

          // Buscar usuario en Prisma
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true
            }
          });

          if (!user || !user.email || !user.password) {
            throw new Error('No existe un usuario con ese email');
          }

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            throw new Error('Contraseña incorrecta');
          }

          // Crear token JWT
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email
          };

        } catch (error) {
          console.error('Error en authorize:', error);
          throw error;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET!
};

const handler = NextAuth(authOptions);

export default handler;

export { handler as GET, handler as POST };
