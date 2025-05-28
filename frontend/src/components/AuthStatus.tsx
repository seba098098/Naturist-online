"use client";

import { useSession } from 'next-auth/react';
import LogoutButton from './LogoutButton';

export default function AuthStatus() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Bienvenido a ML Lujos</h1>
        <p className="text-gray-600 mb-4">¡Hola {session?.user?.email}!</p>
        <p className="text-gray-600">Has iniciado sesión correctamente.</p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Bienvenido a ML Lujos</h1>
      <p className="text-gray-600 mb-4">Para acceder a la tienda, por favor inicia sesión.</p>
      <a
        href="/auth/login"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Iniciar Sesión
      </a>
    </div>
  );
}
