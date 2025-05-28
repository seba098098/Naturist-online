'use client';

import { useSession } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status, update } = useSession();
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    update,
  };
};
