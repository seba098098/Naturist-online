'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

/**
 * Componente de navegación principal
 * - Muestra el logo y los enlaces de navegación
 * - Maneja el estado de autenticación
 * - Muestra diferentes acciones según si el usuario está autenticado o no
 */

// Elementos del menú de navegación
const navItems = [
  {
    name: 'Inicio',
    href: '/',
  },
  {
    name: 'Productos',
    href: '/products',
  },
];

export function MainNav() {
  // Obtener el estado de la sesión
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <div className="flex items-center justify-between h-16">
      {/* Logo de la aplicación */}
      <Link href="/" className="flex items-center space-x-2">
        <span className="text-xl font-bold">Jazila Bazar</span>
      </Link>

      {/* Menú de navegación */}
      <nav className="flex items-center space-x-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Sección de acciones de usuario */}
      <div className="flex items-center space-x-2">
        {isLoading ? (
          // Mostrar placeholder de carga mientras se verifica la sesión
          <div className="w-24 h-9 bg-gray-200 rounded animate-pulse"></div>
        ) : session ? (
          // Usuario autenticado: Mostrar nombre y botón de cierre de sesión
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {session.user?.name || 'Usuario'}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/auth/signout">Cerrar sesión</Link>
            </Button>
          </div>
        ) : (
          // Usuario no autenticado: Mostrar opciones de inicio de sesión
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Registrarse</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
