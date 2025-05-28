import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import axios from 'axios';

// Types for our API response
interface ApiUserResponse {
  id: string;
  email: string;
  name?: string;
  role?: string;
  accessToken: string;
  refreshToken?: string;
}

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
    } & DefaultSession['user'];
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    accessToken: string;
    refreshToken?: string;
  }
}

// Validate environment variables
const requiredEnvVars = ['NEXTAUTH_SECRET', 'NEXT_PUBLIC_API_URL'] as const;
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
  console.error(`❌ ${errorMessage}`);
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMessage);
  }
  
  console.warn('⚠️  Running in development with missing variables');
}

// Auth configuration
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL is not configured');
          }

          const response = await axios.post<ApiUserResponse>(
            `${apiUrl}/api/auth/login`,
            {
              email: credentials.email,
              password: credentials.password,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              timeout: 10000,
            }
          );

          const user = response.data;

          if (!user) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || null,
            role: user.role || 'USER',
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
          };
        } catch (error: unknown) {
          console.error('Authentication error:', error);
          
          let errorMessage = 'An error occurred during login. Please try again.';
          
          if (axios.isAxiosError(error)) {
            if (error.response?.data?.message) {
              errorMessage = String(error.response.data.message);
            } else if (error.response?.status) {
              errorMessage = `Server responded with status: ${error.response.status}`;
            } else if (error.request) {
              errorMessage = 'No response from server. Please check your connection.';
            } else if (error.message) {
              errorMessage = error.message;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email || token.email,
          name: user.name || token.name,
          role: (user as any).role || 'USER',
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
        };
      }

      // Handle session update
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id,
          name: token.name || null,
          email: token.email,
          role: token.role || 'USER',
        };
        
        if (token.accessToken) {
          (session as any).accessToken = token.accessToken;
        }
        if (token.refreshToken) {
          (session as any).refreshToken = token.refreshToken;
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Create auth handler
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
export default authConfig;
