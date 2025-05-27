import { Request, Response, NextFunction } from 'express';

// Tipos de errores personalizados
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Tipos de errores comunes
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
} as const;

// Tipo para los códigos de error
export type ErrorType = keyof typeof ERROR_TYPES;

/**
 * Middleware global para manejo de errores
 * Captura cualquier error no manejado y responde con un formato estandarizado
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

// Factory function para crear errores personalizados
export const createError = (
  message: string,
  statusCode: number,
  errorType: string
) => {
  const error = new AppError(message, statusCode);
  (error as any).errorType = errorType;
  return error;
};

// Funciones de ayuda para errores comunes
export const notFound = (resource = 'Recurso') =>
  createError(`${resource} no encontrado`, 404, ERROR_TYPES.NOT_FOUND);

export const unauthorized = (message = 'No autorizado') =>
  createError(message, 401, ERROR_TYPES.UNAUTHORIZED);

export const forbidden = (message = 'No tiene permisos para realizar esta acción') =>
  createError(message, 403, ERROR_TYPES.FORBIDDEN);

export const validationError = (errors: string[]) => {
  const error = createError('Error de validación', 400, ERROR_TYPES.VALIDATION_ERROR);
  (error as any).errors = errors;
  return error;
};
