/**
 * @file Ruta de autenticación de la API
 * Maneja las solicitudes de autenticación utilizando NextAuth.js
 * Soporta autenticación con credenciales, Google y Facebook
 */

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcryptjs';
import config from '@/config';
import { User, DefaultSession, DefaultUser } from 'next-auth';

// Las declaraciones de tipos se han movido a src/types/next.d.ts para evitar conflictos
// y mantener la consistencia en toda la aplicación

/**
 * Interfaz para el usuario autenticado
 */
interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// Inicializar cliente de Prisma
const prisma = new PrismaClient();

// Cargar configuración
const { API_URL } = config;

// Validar configuración
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET no está definida en las variables de entorno');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Configuración de Google OAuth incompleta');
}

if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
  console.warn('⚠️  Configuración de Facebook OAuth incompleta');
}

/**
 * Configuración de NextAuth
 * Define proveedores de autenticación, callbacks y opciones de sesión
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Proveedor de autenticación con credenciales (email/contraseña)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Correo electrónico', 
          type: 'email',
          placeholder: 'tu@email.com'
        },
        password: { 
          label: 'Contraseña', 
          type: 'password',
          placeholder: '••••••••'
        }
      },
      /**
       * Función para autenticar al usuario con credenciales
       * @param credentials - Credenciales del usuario (email y contraseña)
       * @returns Información del usuario autenticado o null si falla
       */
      async authorize(credentials) {
        try {
          const { email, password } = credentials as { email: string; password: string };
          
          // Validar que se hayan proporcionado email y contraseña
          if (!email || !password) {
            throw new Error('Email y contraseña son requeridos');
          }

          // Buscar usuario en la base de datos
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }, // Normalizar email
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
              role: true
            }
          });

          // Verificar si el usuario existe y tiene contraseña
          if (!user?.password) {
            // Usar un mensaje genérico por seguridad
            throw new Error('Credenciales inválidas');
          }

          // Verificar si el correo está verificado (si es requerido)
          if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
            throw new Error('Por favor verifica tu correo electrónico antes de iniciar sesión');
          }

          // Comparar la contraseña proporcionada con el hash almacenado
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            // Usar un mensaje genérico por seguridad (no revelar si el email existe)
            throw new Error('Credenciales inválidas');
          }

          // Registrar el inicio de sesión exitoso (sin información sensible)
          console.log(`Inicio de sesión exitoso para el usuario: ${user.email}`);
          
          // Crear el objeto de usuario para NextAuth
          const authUser: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            // Establecer un rol por defecto 'USER' ya que el campo role no está en el tipo por defecto
            // Los roles se pueden manejar a través de la base de datos o lógica adicional
            role: 'USER',
            image: null
          };
          
          return authUser;
        } catch (error) {
          // Registrar el error para depuración
          console.error('Error en autenticación:', error);
          // Lanzar un error genérico para el cliente
          throw new Error('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
        }
      },
    }),
    /**
     * Configuración del proveedor de Google OAuth
     * Permite a los usuarios iniciar sesión con su cuenta de Google
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Forzar la pantalla de consentimiento para obtener un refresh_token
          prompt: "consent",
          // Permitir obtener un refresh_token
          access_type: "offline",
          // Especificar que queremos un código de autorización
          response_type: "code",
          // Permisos solicitados a la API de Google
          // - openid: Para autenticación con OpenID Connect
          // - email: Para obtener el correo electrónico del usuario
          // - profile: Para obtener información básica del perfil
          scope: 'openid email profile',
        }
      },
      /**
       * Personaliza el perfil del usuario devuelto por Google
       * @param profile - Perfil del usuario proporcionado por Google
       * @returns Perfil del usuario normalizado para nuestra aplicación
       */
      async profile(profile) {
        return {
          // Usar el ID único de Google como identificador
          id: profile.sub,
          // Nombre completo del usuario
          name: profile.name,
          // Correo electrónico verificado por Google
          email: profile.email,
          // URL de la imagen de perfil de Google
          image: profile.picture,
          // Asignar el rol 'USER' por defecto a los usuarios que se registran con OAuth
          // Los administradores pueden ser promovidos manualmente en la base de datos
          role: 'USER' as const
        };
      }
    }),
    /**
     * Configuración del proveedor de Facebook OAuth
     * Permite a los usuarios iniciar sesión con su cuenta de Facebook
     */
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          // Permisos solicitados a la API de Facebook
          // - email: Para obtener el correo electrónico del usuario
          // - public_profile: Para obtener información básica del perfil
          scope: 'email public_profile'
        }
      },
      /**
       * Personaliza el perfil del usuario devuelto por Facebook
       * @param profile - Perfil del usuario proporcionado por Facebook
       * @returns Perfil del usuario normalizado para nuestra aplicación
       */
      profile(profile) {
        return {
          // Usar el ID de Facebook como identificador
          id: profile.id,
          // Nombre completo del usuario
          name: profile.name,
          // Correo electrónico de Facebook (puede ser null si el usuario no lo ha compartido)
          email: profile.email,
          // URL de la imagen de perfil de Facebook
          image: profile.picture?.data?.url || null,
          // Asignar el rol 'USER' por defecto a los usuarios que se registran con OAuth
          role: 'USER' as const
        };
      }
    })
  ],
  /**
   * Configuración de la estrategia de sesión
   * Usamos JWT para almacenar la información de la sesión en una cookie segura
   */
  session: {
    strategy: 'jwt' as const,
  },
  
  /**
   * Personalización de las páginas de autenticación
   * Aquí podemos especificar rutas personalizadas para el flujo de autenticación
   */
  pages: {
    // Ruta personalizada para la página de inicio de sesión
    signIn: '/auth/login',
    // Nota: Podemos agregar más rutas personalizadas aquí si es necesario
    // error: '/auth/error', // Página de error personalizada
    // verifyRequest: '/auth/verify-request', // Página de verificación de correo
  },
  
  /**
   * Callbacks para personalizar el comportamiento de autenticación
   * Estos se ejecutan en diferentes momentos del flujo de autenticación
   */
  callbacks: {
    /**
     * Callback que se ejecuta cuando se genera un JWT
     * Se usa para personalizar el token con información adicional del usuario
     */
    async jwt({ token, user }) {
      // Si hay un usuario (durante el inicio de sesión)
      if (user) {
        const customUser = user as User;
        return {
          ...token,
          id: customUser.id,
          name: customUser.name || null,
          email: customUser.email || null,
          role: customUser.role || 'USER',
          image: customUser.image || null
        };
      }
      
      // Mantener el token existente
      return token;
    },
    
    /**
     * Callback que se ejecuta cuando se crea o actualiza una sesión
     * Se usa para personalizar el objeto de sesión que se envía al cliente
     */
    async session({ session, token }) {
      // Asegurarse de que session.user existe
      if (session.user) {
        // Agregar los campos personalizados a la sesión
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id as string,
            name: token.name,
            email: token.email,
            role: (token.role as 'USER' | 'ADMIN') || 'USER',
            image: token.picture || null
          }
        };
      }
      
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET!
};

const handler = NextAuth(authOptions);

export default handler;

export { handler as GET, handler as POST };
