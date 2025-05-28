'use client';

import './globals.css';
import { Providers } from './providers';

// Mostrar logs al inicio
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
      <body>
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}


