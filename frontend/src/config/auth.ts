// Importaciones de NextAuth y tipos necesarios
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig, DefaultSession } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

/**
 * Interfaz para el usuario personalizado
 * Extiende el tipo de usuario por defecto con campos adicionales
 */
interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  accessToken?: string;
}

/**
 * Interfaz para la sesión personalizada
 * Incluye el token de acceso y el usuario personalizado
 */
interface CustomSession extends DefaultSession {
  user: CustomUser;
  accessToken?: string;
}

/**
 * Interfaz para el token JWT personalizado
 * Almacena información del usuario y tokens
 */
/**
 * Interfaz para el token JWT personalizado
 * Extiende el tipo JWT por defecto con campos adicionales
 */
interface CustomJWT extends DefaultJWT {
  /** ID único del usuario */
  id: string;
  
  /** Nombre para mostrar del usuario */
  name?: string | null;
  
  /** Correo electrónico del usuario */
  email?: string | null;
  
  /** URL de la imagen de perfil del usuario */
  image?: string | null;
  
  /** Rol del usuario (valor por defecto: 'user') */
  role: string;
  
  /** Token de acceso para autenticación con la API */
  accessToken?: string;
}

// Configuración de la URL de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Extensión de tipos de NextAuth para TypeScript
 * Esto nos permite tener tipado fuerte en toda la aplicación
 */
declare module 'next-auth' {
  interface User extends CustomUser {}
  interface Session extends CustomSession {}
}

declare module 'next-auth/jwt' {
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
  
  // Callbacks para personalizar el comportamiento de autenticación
  callbacks: {
    /**
     * Callback que se ejecuta cuando se genera un JWT
     * Se usa para personalizar el token con información adicional del usuario
     * @param params - Parámetros del callback JWT
     * @param params.token - Token JWT actual
     * @param params.user - Información del usuario (disponible durante el inicio de sesión)
     * @param params.account - Información de la cuenta del proveedor (OAuth)
     * @returns Token JWT actualizado
     */
    async jwt({ token, user, account }) {
      // Si hay un usuario (durante el inicio de sesión)
      if (user) {
        const customUser = user as CustomUser;
        return {
          ...token,
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          image: user.image || null,
          role: customUser.role || 'user', // Valor por defecto 'user'
          accessToken: customUser.accessToken || account?.access_token || token.accessToken,
        };
      }
      
      // Si hay un token de acceso de la cuenta (ej: Google OAuth)
      if (account?.access_token) {
        return {
          ...token,
          accessToken: account.access_token,
          // Asegurarse de que siempre haya un rol
          role: (token as CustomJWT).role || 'user',
        };
      }
      
      // Mantener el token existente, asegurando que tenga un rol
      return {
        ...token,
        role: (token as CustomJWT).role || 'user',
      };
    },
    
    /**
     * Callback que se ejecuta cuando se crea o actualiza una sesión
     * Se usa para personalizar el objeto de sesión que se envía al cliente
     * @param params - Parámetros del callback de sesión
     * @param params.session - Sesión actual
     * @param params.token - Token JWT actual
     * @returns Sesión personalizada
     */
    async session({ session, token }) {
      // Asegurarse de que token tenga el tipo correcto
      const customToken = token as CustomJWT;
      
      // Crear una copia segura de la sesión con los datos actualizados
      const customSession = {
        ...session,
        user: {
          ...session.user,
          id: customToken.id,
          name: customToken.name,
          email: customToken.email || '',
          image: customToken.image || null,
          role: customToken.role || 'user', // Valor por defecto 'user'
        },
        accessToken: customToken.accessToken,
      };
      
      return customSession;
    },
  },
  
  // Habilitar mensajes de depuración en desarrollo
  debug: process.env.NODE_ENV === 'development',
  secret: NEXTAUTH_SECRET,
};

// Exportar el manejador de autenticación
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
