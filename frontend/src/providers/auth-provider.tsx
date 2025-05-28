'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { Session } from 'next-auth';

interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null;
  basePath?: string;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  refetchWhenOffline?: false;
  /**
   * @deprecated No es necesario en NextAuth v5
   */
  refetchIntervalInBackground?: boolean;
}

/**
 * Proveedor de autenticación que envuelve la aplicación
 * Proporciona el contexto de autenticación a todos los componentes hijos
 */
export function AuthProvider({ 
  children, 
  session,
  basePath = '/api/auth',
  refetchInterval = 60 * 5, // 5 minutos
  refetchOnWindowFocus = true,
  refetchWhenOffline = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refetchIntervalInBackground = false, // Deprecated en v5
}: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      basePath={basePath}
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={refetchOnWindowFocus}
      refetchWhenOffline={refetchWhenOffline}
    >
      {children}
    </SessionProvider>
  );
}
