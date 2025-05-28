// Tipos para Next.js
import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next' {
  interface NextApiRequest {
    user?: DefaultUser;
  }
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
  }
}
