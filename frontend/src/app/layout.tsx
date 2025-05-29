'use client';

import './globals.css';
import { Providers } from './providers';
import { MainNav } from '@/components/layout/MainNav';

/**
 * Layout principal de la aplicación
 * - Configura la estructura base de la aplicación
 * - Incluye el menú de navegación superior fijo
 * - Asegura que el contenido principal ocupe el espacio restante
 */

// Mostrar logs de configuración en desarrollo
if (typeof window !== 'undefined') {
  console.log('Configuración de layout:');
  console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL);
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="es">
      <head>
        <title>Jazila Bazar</title>
        <meta name="description" content="Diseño base con header y footer" />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Proveedores de autenticación y temas */}
        <Providers>
          {/* Encabezado fijo en la parte superior */}
          <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
            <div className="container mx-auto px-4">
              {/* Componente de navegación principal */}
              <MainNav />
            </div>
          </header>
          
          {/* Contenido principal de la página */}
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}


