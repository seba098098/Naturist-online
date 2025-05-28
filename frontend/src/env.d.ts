namespace NodeJS {
  interface ProcessEnv {
    // Next.js
    NODE_ENV: 'development' | 'production' | 'test';
    
    // API
    NEXT_PUBLIC_API_URL: string;
    
    // NextAuth
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    
    // Google OAuth
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
    NEXT_PUBLIC_GOOGLE_CLIENT_SECRET: string;
    
    // Database
    DATABASE_URL: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {}
}
