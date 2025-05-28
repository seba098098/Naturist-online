import { useSession, signIn, signOut, SignInResponse } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import React from 'react';

interface UseAuthReturn {
  user: any;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  login: (email: string, password: string) => Promise<SignInResponse | undefined>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

/**
 * Hook personalizado para manejar la autenticación
 * Proporciona métodos para iniciar y cerrar sesión, y el estado actual del usuario
 */
export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl: '/dashboard',
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.url) {
          router.push(result.url);
        }

        return result;
      } catch (error: any) {
        console.error('Error al iniciar sesión:', error);
        toast.error(error.message || 'Error al iniciar sesión');
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
      throw error;
    }
  }, [router]);

  return {
    user: session?.user || null,
    status: status as 'authenticated' | 'unauthenticated' | 'loading',
    login,
    logout,
    isAuthenticated: status === 'authenticated',
    loading: status === 'loading',
  };
};

/**
 * Hook para proteger rutas que requieren autenticación
 */
export const useProtectedRoute = (redirectTo = '/auth/login') => {
  const { status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo]);

  return { status };
};
