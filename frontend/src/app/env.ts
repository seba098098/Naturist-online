import { API_URL } from '../config/config';

// Mostrar logs al inicio
console.log('Configuración de entorno:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('API_URL:', API_URL);

// Verificar que la URL es válida
try {
  new URL(API_URL);
  console.log('URL válida');
} catch (error) {
  console.error('URL inválida:', error);
}

// Exportar la URL para usarla en el frontend
export const env = {
  apiUrl: API_URL,
};
