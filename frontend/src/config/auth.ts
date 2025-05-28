import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig, DefaultSession } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

// Tipos personalizados
interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  accessToken?: string;
}

interface CustomSession extends DefaultSession {
  user: CustomUser;
  accessToken?: string;
}

interface CustomJWT extends DefaultJWT {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  accessToken?: string;
}

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Extender tipos de NextAuth
declare module 'next-auth' {
  /**
   * Extiende la interfaz de usuario por defecto
   */
  interface User extends CustomUser {}

  /**
   * Extiende la interfaz de sesión por defecto
   */
  interface Session extends CustomSession {}
}

declare module 'next-auth/jwt' {
  /**
   * Extiende la interfaz JWT por defecto
   */
  interface JWT extends CustomJWT {}
}

// Verificar variables de entorno
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not defined in environment variables');
}

// Configuración de NextAuth
export const authConfig: NextAuthConfig = {
  
  // Configuración de páginas personalizadas
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  
  // Configuración de sesión
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  
  // Configuración de cookies
  cookies: process.env.NODE_ENV === 'production' ? {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: true,
      },
    },
  } : undefined,
  
  // Configuración de proveedores
  providers: [
    // Autenticación con credenciales
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
          // Llamar al endpoint de login del backend
          const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
          }

          const user = await response.json();
          
          if (!user) {
            throw new Error('No user found with this email');
          }

          // Asegurarse de que el objeto de usuario tenga los campos necesarios
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            accessToken: user.token || user.accessToken,
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          throw new Error(error instanceof Error ? error.message : 'Authentication failed');
        }
      }
    }),
    
    // Autenticación con Google
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
            scope: 'openid email profile',
          },
        },
        async profile(profile) {
          try {
            // Enviar el token de Google al backend
            const response = await fetch(`${API_URL}/api/google-login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: profile.sub, // o el token de acceso de Google
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Google authentication failed');
            }

            const user = await response.json();
            
            return {
              id: user.id,
              name: user.name || profile.name,
              email: user.email || profile.email,
              image: user.image || profile.picture,
              role: user.role || 'user',
            };
          } catch (error) {
            console.error('Error during Google authentication:', error);
            throw new Error('Google authentication failed');
          }
        },
      })
    ] : []),
  ],
  
  // Configuración de páginas personalizadas
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  
  // Configuración de sesión
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  
  // Callbacks
  callbacks: {
    async jwt({ token, user, account }): Promise<CustomJWT> {
      const customToken = token as CustomJWT;
      
      // Pasar datos del usuario al token
      if (user) {
        customToken.id = user.id;
        customToken.name = user.name || null;
        customToken.email = user.email || null;
        customToken.image = user.image || null;
        customToken.role = (user as CustomUser).role || 'user';
        customToken.accessToken = (user as CustomUser).accessToken;
      }
      
      // Si hay un token de acceso de la cuenta (por ejemplo, de Google)
      if (account?.access_token) {
        customToken.accessToken = account.access_token;
      }
      
      return customToken;
    },
    
    async session({ session, token }): Promise<CustomSession> {
      const customSession = session as CustomSession;
      const customToken = token as CustomJWT;
      
      // Pasar datos del token a la sesión
      if (customSession.user) {
        customSession.user.id = customToken.id;
        customSession.user.name = customToken.name;
        customSession.user.email = customToken.email || '';
        customSession.user.image = customToken.image;
        customSession.user.role = customToken.role;
        customSession.accessToken = customToken.accessToken;
      }
      
      return customSession;
    },
  },
  
  // Habilitar mensajes de depuración en desarrollo
  debug: process.env.NODE_ENV === 'development',
  secret: NEXTAUTH_SECRET,
};

// Exportar el manejador de autenticación
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
