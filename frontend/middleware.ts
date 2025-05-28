import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Rutas que no requieren autenticación
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/public'
];

// Rutas protegidas que requieren autenticación
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/api/private'
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Verificar si la ruta es pública
  const isPublicPath = publicPaths.some(publicPath => 
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

  // Verificar si la ruta está protegida
  const isProtectedPath = protectedPaths.some(protectedPath => 
    pathname === protectedPath || pathname.startsWith(`${protectedPath}/`)
  );

  // Permitir acceso a rutas públicas
  if (isPublicPath) {
    // Si el usuario está autenticado y accede a la página de login/registro, redirigir al dashboard
    if ((pathname === '/auth/login' || pathname === '/auth/register') && req.nextUrl.pathname !== '/') {
      const token = await getToken({ req });
      if (token) {
        const url = new URL('/dashboard', req.url);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // Para rutas protegidas, verificar autenticación
  if (isProtectedPath) {
    const token = await getToken({ req });
    
    // Si no hay token, redirigir al login
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Para todas las demás rutas, continuar
  return NextResponse.next();
}

// Configuración para excluir rutas del middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
