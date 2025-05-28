import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extiende la interfaz de sesión por defecto
   */
  interface Session {
    user: {
      id: string;
      role?: 'USER' | 'ADMIN';
    } & DefaultSession['user'];
    expires: string;
  }


  /**
   * Extiende la interfaz de usuario por defecto
   */
  interface User extends DefaultUser {
    id: string;
    role?: 'USER' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extiende la interfaz JWT
   */
  interface JWT {
    id: string;
    role?: 'USER' | 'ADMIN';
    accessToken?: string;
  }
}
