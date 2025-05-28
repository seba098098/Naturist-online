/** @type {import('next').NextConfig} */

// Cargar variables de entorno manualmente
require('dotenv').config({ path: '.env.local' });

// Debug: Verificar variables de entorno
console.log('=== next.config.js ===');
console.log('Directamente de process.env:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'No definido');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'No definido');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_SECRET:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ? '***' + process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET.slice(-4) : 'No definido');
console.log('NEXT_PUBLIC_NEXTAUTH_URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'No definido');
console.log('NEXT_PUBLIC_NEXTAUTH_SECRET:', process.env.NEXT_PUBLIC_NEXTAUTH_SECRET ? '***' + process.env.NEXT_PUBLIC_NEXTAUTH_SECRET.slice(-4) : 'No definido');
console.log('========================');

// Configuración básica de Next.js
const nextConfig = {
  // Configuración de imágenes
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com', // Para avatares de Google
      'avatars.githubusercontent.com', // Para avatares de GitHub
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Configuración de redirecciones
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'cookie',
            key: 'next-auth.session-token',
          },
        ],
        permanent: false,
        destination: '/dashboard',
      },
      {
        source: '/auth/login',
        has: [
          {
            type: 'cookie',
            key: 'next-auth.session-token',
          },
        ],
        permanent: false,
        destination: '/dashboard',
      },
    ];
  },

  // Configuración de webpack
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  
  // Configuración de runtime (disponible tanto en cliente como servidor)
  env: {
    // Forzar la carga de las variables aquí también
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_CLIENT_SECRET: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_NEXTAUTH_SECRET: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  },
  
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    nextAuthUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000',
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    nextAuthSecret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  },
}

// Mostrar las variables de entorno cargadas
console.log('=== Variables de entorno cargadas en next.config.js ===');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'No definido');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'No definido');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_SECRET:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ? '***' + process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET.slice(-4) : 'No definido');
console.log('NEXT_PUBLIC_NEXTAUTH_URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'No definido');
console.log('NEXT_PUBLIC_NEXTAUTH_SECRET:', process.env.NEXT_PUBLIC_NEXTAUTH_SECRET ? '***' + process.env.NEXT_PUBLIC_NEXTAUTH_SECRET.slice(-4) : 'No definido');
console.log('====================================================');

module.exports = nextConfig
