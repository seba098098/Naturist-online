// Configuración de la aplicación
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Mostrar la configuración cargada
console.log('=== Configuración de la aplicación ===');
console.log('API_URL:', API_URL);
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'No definido');
console.log('NEXT_PUBLIC_NEXTAUTH_URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000');

// Verificar que la URL de la API es válida
try {
  new URL(API_URL);
  console.log('✓ URL de la API válida');
} catch (error) {
  console.error('✗ URL de la API inválida:', error);
}

// Verificar variables críticas
if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  console.error('✗ ERROR: NEXT_PUBLIC_GOOGLE_CLIENT_ID no está definido');
}

if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET) {
  console.error('✗ ERROR: NEXT_PUBLIC_GOOGLE_CLIENT_SECRET no está definido');
}

console.log('===================================');
