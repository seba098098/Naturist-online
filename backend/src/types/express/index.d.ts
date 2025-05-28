/**
 * Módulo de definición de tipos para Express
 * Extiende las interfaces de Express para añadir tipos personalizados a los objetos Request
 */

import 'express';

/**
 * Extensión de la interfaz Request de Express para incluir propiedades personalizadas
 * que se añaden a través de los middlewares de la aplicación.
 */
declare global {
  namespace Express {
    /**
     * Interfaz extendida del objeto Request de Express
     */
    export interface Request {
      /**
       * Información del usuario autenticado.
       * Definida por el middleware de autenticación cuando se verifica un token JWT válido.
       */
      user?: {
        /** ID único del usuario en la base de datos */
        userId: string;
        
        /** Rol del usuario (ej: 'ADMIN', 'USER') */
        role: string;
        
        /** Timestamp de emisión del token (issued at) */
        iat: number;
        
        /** Timestamp de expiración del token (expiration) */
        exp: number;
      };
    }
  }
}
