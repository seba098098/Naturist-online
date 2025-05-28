import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export async function signIn(provider: string, credentials?: any) {
  try {
    const callbackUrl = typeof window !== 'undefined' ? window.location.origin : '/';
    
    const result = await nextAuthSignIn(provider, {
      redirect: true,
      callbackUrl: callbackUrl,
      ...credentials,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // No necesitamos redirigir manualmente ya que usamos redirect: true
    return { success: true };
  } catch (error: any) {
    console.error('Error en signIn:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
}

export async function signOut() {
  try {
    await nextAuthSignOut({
      callbackUrl: '/auth/login',
      redirect: true
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw new Error('Error al cerrar sesión');
  }
}
