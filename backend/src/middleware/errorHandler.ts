/**
 * Módulo de manejo de errores
 * Proporciona utilidades para manejar y formatear errores de manera consistente
 * Incluye un middleware global de manejo de errores y funciones para errores comunes
 */

// Importación de dependencias
import { Request, Response, NextFunction } from 'express'; // Tipos de Express

/**
 * Clase base para errores personalizados de la aplicación
 * Extiende la clase Error nativa de JavaScript
 */
class AppError extends Error {
  /** Código de estado HTTP */
  statusCode: number;
  
  /** Indica si el error es operacional (predecible) o un error inesperado */
  isOperational: boolean;

  /**
   * Crea una nueva instancia de AppError
   * @param message - Mensaje descriptivo del error
   * @param statusCode - Código de estado HTTP
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Por defecto, todos los errores son operacionales
    
    // Captura el stack trace para mejor depuración
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Enumeración de tipos de errores comunes en la aplicación
 * Cada tipo tiene un identificador único que puede ser usado para manejar errores específicos
 */
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',    // Errores de validación de datos
  NOT_FOUND: 'NOT_FOUND',                // Recurso no encontrado
  UNAUTHORIZED: 'UNAUTHORIZED',          // No autenticado o token inválido
  FORBIDDEN: 'FORBIDDEN',                // No tiene permisos
  CONFLICT: 'CONFLICT',                  // Conflicto (ej: duplicados)
  RATE_LIMIT: 'RATE_LIMIT',             // Límite de tasa excedido
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR' // Error interno del servidor
} as const;

/**
 * Tipo TypeScript que representa las claves del objeto ERROR_TYPES
 * Útil para el tipado fuerte en funciones que manejan tipos de errores
 */
export type ErrorType = keyof typeof ERROR_TYPES;

/**
 * Middleware global para manejo de errores de Express
 * Captura cualquier error no manejado en las rutas y responde con un formato JSON estandarizado
 * 
 * @param err - Error capturado
 * @param _req - Objeto Request de Express
 * @param res - Objeto Response de Express
 * @param _next - Función next de Express (no utilizado aquí, pero necesario para la firma del middleware)
 * 
 * @returns Respuesta JSON con el error formateado
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Configuración por defecto para errores no manejados
  let statusCode = err.statusCode || 500;
  let errorType: keyof typeof ERROR_TYPES = 'INTERNAL_SERVER_ERROR';
  let message = 'Error interno del servidor';
  let errors: string[] | undefined = undefined;

  // Manejo de errores específicos
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'VALIDATION_ERROR';
    message = 'Error de validación';
    errors = Object.values((err as any).errors).map((e: any) => e.message);
  } else if ((err as any).code === 'P2002') {
    // Error de duplicado de Prisma
    statusCode = 409;
    errorType = 'CONFLICT';
    message = 'El recurso ya existe';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'UNAUTHORIZED';
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'UNAUTHORIZED';
    message = 'Token expirado';
  } else if ((err as any).isOperational) {
    // Errores operacionales conocidos
    message = err.message;
    errorType = (err as any).errorType || 'INTERNAL_SERVER_ERROR';
  }

  // Log del error (en producción, usa un logger real)
  if (process.env.NODE_ENV === 'development') {
    console.error('\n--- ERROR ---');
    console.error('Type:', errorType);
    console.error('Status:', statusCode);
    console.error('Message:', message);
    if (errors) console.error('Validation Errors:', errors);
    console.error('Stack:', err.stack);
    console.error('--- END ERROR ---\n');
  }

  // Respuesta al cliente
  res.status(statusCode).json({
    success: false,
    error: {
      type: errorType,
      message,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Factory function para crear errores personalizados de manera consistente
 * 
 * @param message - Mensaje descriptivo del error
 * @param statusCode - Código de estado HTTP
 * @param errorType - Tipo de error (debe ser una clave de ERROR_TYPES)
 * @returns Instancia de Error con propiedades adicionales
 * 
 * @example
 * throw createError('Usuario no encontrado', 404, 'NOT_FOUND');
 */
export const createError = (
  message: string,
  statusCode: number,
  errorType: string
) => {
  const error = new AppError(message, statusCode);
  (error as any).errorType = errorType;
  return error;
};

/**
 * Función de ayuda para errores 404 (No encontrado)
 * @param resource - Nombre del recurso que no se encontró (opcional)
 * @returns Error con código 404
 */
export const notFound = (resource = 'Recurso') =>
  createError(`${resource} no encontrado`, 404, ERROR_TYPES.NOT_FOUND);

/**
 * Función de ayuda para errores 401 (No autorizado)
 * @param message - Mensaje personalizado (opcional)
 * @returns Error con código 401
 */
export const unauthorized = (message = 'No autorizado') =>
  createError(message, 401, ERROR_TYPES.UNAUTHORIZED);

/**
 * Función de ayuda para errores 403 (Prohibido)
 * @param message - Mensaje personalizado (opcional)
 * @returns Error con código 403
 */
export const forbidden = (message = 'No tiene permisos para realizar esta acción') =>
  createError(message, 403, ERROR_TYPES.FORBIDDEN);

/**
 * Función de ayuda para errores de validación (400)
 * @param errors - Array de mensajes de error de validación
 * @returns Error con código 400 y lista de errores de validación
 * 
 * @example
 * throw validationError(['El email es requerido', 'La contraseña es muy corta']);
 */
export const validationError = (errors: string[]) => {
  const error = createError('Error de validación', 400, ERROR_TYPES.VALIDATION_ERROR);
  (error as any).errors = errors; // Añade la lista de errores al objeto de error
  return error;
};
