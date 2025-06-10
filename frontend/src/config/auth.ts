// Importaciones de NextAuth y tipos necesarios
import NextAuth, { type DefaultSession, type User, type Account, type Profile } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';
import type { JWT as DefaultJWT, JWT } from 'next-auth/jwt';

/**
 * Interfaz para el usuario personalizado
 * Extiende el tipo de usuario por defecto con campos adicionales
 */
interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'USER' | 'ADMIN';
  accessToken?: string;
}

/**
 * Interfaz para la sesión personalizada
 * Incluye el token de acceso y el usuario personalizado
 */
interface CustomSession extends DefaultSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: 'USER' | 'ADMIN';
    accessToken?: string;
  };
  accessToken?: string;
}

/**
 * Interfaz para el token JWT personalizado
 * Extiende el tipo JWT por defecto con campos adicionales
 */
type Role = 'USER' | 'ADMIN';

interface CustomJWT {
  /** ID único del usuario */
  id?: string;
  
  /** Nombre para mostrar del usuario */
  name?: string | null;
  
  /** Correo electrónico del usuario */
  email?: string | null;
  
  /** URL de la imagen de perfil del usuario */
  image?: string | null;
  
  /** Rol del usuario */
  role?: 'USER' | 'ADMIN';
  
  /** Token de acceso */
  accessToken?: string;
  
  [key: string]: any;
}

// Configuración de la URL de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const NEXTAUTH_URL = process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Extensión de tipos de NextAuth para TypeScript
 * Esto nos permite tener tipado fuerte en toda la aplicación
 */
declare module 'next-auth' {
  interface User extends CustomUser {}
  interface Session extends CustomSession {}
}

// Extensión de tipos para JWT
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: 'USER' | 'ADMIN';
    accessToken?: string;
    [key: string]: any;
  }
}

type Session = CustomSession;

// Verificar variables de entorno
const NEXTAUTH_SECRET = process.env.NEXT_PUBLIC_NEXTAUTH_SECRET;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;

if (!NEXTAUTH_SECRET) {
  throw new Error('NEXT_PUBLIC_NEXTAUTH_SECRET is not defined in environment variables');
}

if (!GOOGLE_CLIENT_ID) {
  throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined in environment variables');
}

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_SECRET is not defined in environment variables');
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
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name || profile.email?.split('@')[0] || 'Usuario',
            email: profile.email,
            image: profile.picture,
            role: 'USER' // Rol por defecto
          };
        }
      })
    ] : []),
  ],
  
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
    async jwt({ token, user, account, trigger, session, profile }) {
      // Enviar el token de Google al backend solo en el primer inicio de sesión
      if (account?.provider === 'google' && account?.id_token) {
        try {
          const response = await fetch(`${API_URL}/api/google-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: account.id_token,
            }),
            credentials: 'include' // Importante para las cookies
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al autenticar con Google');
          }

          const data = await response.json();
          
          // Actualizar el token con la respuesta del backend
          token.accessToken = data.data.token;
          token.role = data.data.user.role;
          token.id = data.data.user.id;
          token.name = data.data.user.name;
          token.email = data.data.user.email;
          token.image = data.data.user.avatar_url;
          
          // Si hay un usuario, actualizar sus datos
          if (user) {
            user.id = data.data.user.id;
            user.role = data.data.user.role;
            user.name = data.data.user.name;
            user.email = data.data.user.email;
            user.image = data.data.user.avatar_url;
          }
        } catch (error) {
          console.error('Error en la autenticación con Google:', error);
          throw error;
        }
      } else if (account?.provider === 'google' && account?.access_token) {
        // Si ya tenemos un token de acceso de Google
        token.accessToken = account.access_token;
        token.id = token.sub || '';
        token.role = token.role || 'USER';
      }
      
      // Si es el primer inicio de sesión, añadir los datos del usuario al token
      if (user) {
        token.id = user.id;
        token.role = (user.role as Role) || 'USER';
        if (user.accessToken) {
          token.accessToken = user.accessToken;
        }
      }
      
      // Si es una actualización de sesión
      if (trigger === 'update' && session) {
        return { ...token, ...session.user };
      }
      
      return token;
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
      
      // Actualizar la sesión con los datos del token
      if (session.user) {
        session.user = {
          ...session.user,
          id: customToken.id || '',
          name: customToken.name || null,
          email: customToken.email || '', // Asegurar que email sea string, no null
          image: customToken.image || null,
          role: (customToken.role as 'USER' | 'ADMIN') || 'USER',
        };
      }
      
      // Añadir el token de acceso a la sesión
      if (customToken.accessToken) {
        (session as any).accessToken = customToken.accessToken;
      }
      
      return session as CustomSession;
    },
  },
  
  // Habilitar mensajes de depuración en desarrollo
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  trustHost: true,
  // Configuración de la URL base para NextAuth
  theme: {
    colorScheme: 'light',
  },
};

// Exportar el manejador de autenticación
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
