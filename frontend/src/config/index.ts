import { Config } from './types';

/**
 * Validar que una URL sea válida
 * @param url - URL a validar
 * @returns {boolean} true si la URL es válida
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Configuración de la aplicación
 * Se cargan las variables de entorno con valores por defecto
 */
const config: Config = {
  // URL base de la API del backend
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  
  // URL base de la aplicación (para enlaces absolutos)
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Tiempo máximo de sesión (30 días por defecto)
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE 
    ? parseInt(process.env.SESSION_MAX_AGE, 10) 
    : 30 * 24 * 60 * 60,
    
  // Clave secreta para NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

// Validaciones de configuración en tiempo de ejecución (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  console.group('🔧 Configuración de la aplicación');
  
  // Validar URL de la API
  console.log('🌐 API_URL:', config.API_URL);
  if (!isValidUrl(config.API_URL)) {
    console.warn('⚠️  API_URL no es una URL válida');
  }
  
  // Validar URL de la aplicación
  console.log('🏠 NEXT_PUBLIC_APP_URL:', config.NEXT_PUBLIC_APP_URL);
  if (config.NEXT_PUBLIC_APP_URL && !isValidUrl(config.NEXT_PUBLIC_APP_URL)) {
    console.warn('⚠️  NEXT_PUBLIC_APP_URL no es una URL válida');
  }
  
  // Validar clave secreta
  if (!config.NEXTAUTH_SECRET) {
    console.warn('⚠️  NEXTAUTH_SECRET no está definida. Esto puede causar problemas con la autenticación.');
  }
  
  console.groupEnd();
}

export default config;
