// Tipos para Next.js
import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next' {
  interface NextApiRequest {
    user?: DefaultUser & {
      id: string;
      role?: 'USER' | 'ADMIN';
      accessToken?: string;
    };
  }
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
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

  interface User extends DefaultUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: 'USER' | 'ADMIN';
    accessToken?: string;
  }
}

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
