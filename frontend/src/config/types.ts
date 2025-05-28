/**
 * Interfaz que define la estructura de configuración de la aplicación
 * @property {string} API_URL - URL base de la API del backend
 * @property {string} [NEXT_PUBLIC_APP_URL] - URL base de la aplicación (opcional)
 * @property {number} [SESSION_MAX_AGE] - Tiempo máximo de duración de la sesión en segundos (opcional)
 * @property {string} [NEXTAUTH_SECRET] - Clave secreta para NextAuth (opcional, se recomienda usar variables de entorno)
 */
export interface Config {
  API_URL: string;
  NEXT_PUBLIC_APP_URL?: string;
  SESSION_MAX_AGE?: number;
  NEXTAUTH_SECRET?: string;
}
