import NextAuth, { type DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Extender tipos de NextAuth
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
  }
}

// Cliente de Prisma
const prisma = new PrismaClient();

// Validación de variables de entorno
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

// Verificar variables de entorno faltantes
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
  } else {
    console.warn('⚠️  Ejecutando en modo desarrollo con variables faltantes');
  }
}

export const authOptions = {
  // Proveedores de autenticación
  providers: [
    // Autenticación con credenciales (email/contraseña)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        try {
          // Buscar usuario por email
          const user = await prisma.user.findUnique({
            where: { 
              email: String(credentials.email) 
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true
            }
          });

          if (!user) {
            throw new Error('Credenciales inválidas');
          }

          // Verificar contraseña
          if (!user.password) {
            throw new Error('Este usuario no tiene una contraseña configurada');
          }
          const isValid = await compare(String(credentials.password), user.password || '');
          if (!isValid) {
            throw new Error('Credenciales inválidas');
          }

          // Retornar solo la información necesaria del usuario
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'user', // Asignar un rol por defecto
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          throw new Error('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
        }
      },
    }),

    // Proveedor de Google (opcional)
    ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  // Configuración de sesión
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar la sesión cada 24 horas
  },

  // Páginas personalizadas
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  // Callbacks
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      // Añadir información adicional a la sesión
      if (session.user) {
        session.user.id = token.sub || token.id || '';
        session.user.role = token.role as string;
      }
      return session;
    },
    
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      // Añadir información al token JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // Si es el primer inicio de sesión con un proveedor OAuth
      if (account?.provider === 'google' && user) {
        // Aquí podrías sincronizar con tu base de datos si es necesario
      }
      
      return token;
    },
  },

  // Eventos
  events: {
    async signIn({ user, account, profile, isNewUser }: { user: any; account: any; profile?: any; isNewUser?: boolean }) {
      // Registrar inicio de sesión exitoso
      console.log('Usuario autenticado:', { 
        userId: user.id, 
        email: user.email,
        provider: account?.provider,
        isNewUser 
      });
      
      // Aquí podrías registrar el inicio de sesión en tu base de datos
    },
    
    async signOut({ token }: { token: any }) {
      // Registrar cierre de sesión
      console.log('Usuario cerró sesión:', token.sub);
    },
    
    async error(error: any) {
      // Registrar errores de autenticación
      console.error('Error de autenticación:', error);
    },
  },

  // Configuración de cookies
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.tudominio.com' : undefined,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // Configuración de seguridad
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  
  // Logger
  logger: {
    error(code: string, metadata: any) {
      console.error(`NextAuth error [${code}]:`, metadata);
    },
    warn(code: string) {
      console.warn(`NextAuth warning [${code}]`);
    },
    debug(code: string, metadata: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth debug [${code}]:`, metadata);
      }
    }
  },
};