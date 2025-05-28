/**
 * Módulo de middleware de autenticación
 * Proporciona middlewares para:
 * - Verificación de tokens JWT
 * - Control de acceso basado en roles
 * - Verificación de propiedad de recursos
 */

// Importación de dependencias
import { Request, Response, NextFunction } from 'express'; // Tipos de Express
import jwt from 'jsonwebtoken'; // Para verificar tokens JWT
import { createError, unauthorized } from './errorHandler'; // Utilidades para manejo de errores

/**
 * Extensión de la interfaz Request de Express para incluir la propiedad user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;  // ID del usuario autenticado
        role: string;   // Rol del usuario (ej: 'ADMIN', 'USER')
        iat: number;    // Timestamp de emisión del token (issued at)
        exp: number;    // Timestamp de expiración del token (expiration)
      };
    }
  }
}

/**
 * Configuración de JWT
 * La clave secreta se obtiene de las variables de entorno con un valor por defecto para desarrollo
 * En producción, JWT_SECRET debe estar configurado en las variables de entorno
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Usar una clave segura en producción

/**
 * Middleware para verificar la autenticación mediante JWT
 * Extrae el token del header 'Authorization' (formato: 'Bearer <token>')
 * o de las cookies (clave 'token')
 * 
 * @param req - Objeto de solicitud de Express
 * @param _res - Objeto de respuesta de Express (no utilizado)
 * @param next - Función para pasar al siguiente middleware
 * @returns Llama a next() si la autenticación es exitosa, o devuelve un error 401 si falla
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Obtener el token del header Authorization o de las cookies
    let token = '';
    
    // 1. Verificar el header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // 2. Si no está en el header, verificar las cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(unauthorized('No se proporcionó un token de autenticación'));
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      iat: number;
      exp: number;
    };

    // Añadir la información del usuario al objeto de solicitud
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(unauthorized('Token expirado'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(unauthorized('Token inválido'));
    }
    next(createError('Error de autenticación', 500, 'AUTH_ERROR'));
  }
};

/**
 * Middleware para verificar que el usuario autenticado tenga rol de administrador
 * 
 * @param req - Objeto de solicitud de Express (debe contener req.user)
 * @param _res - Objeto de respuesta de Express (no utilizado)
 * @param next - Función para pasar al siguiente middleware
 * @returns Llama a next() si el usuario es administrador, o devuelve un error 403 si no tiene permisos
 */
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(createError('Acceso denegado: Se requieren permisos de administrador', 403, 'FORBIDDEN'));
  }
  next();
};

/**
 * Factory de middleware para verificar roles específicos
 * 
 * @param roles - Array de roles que tienen permiso para acceder
 * @returns Middleware de Express que verifica si el usuario tiene uno de los roles permitidos
 * 
 * @example
 * // Uso en una ruta
 * router.get('/admin', checkRole(['ADMIN', 'SUPER_ADMIN']), adminController.index);
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError('No tienes permisos para realizar esta acción', 403, 'FORBIDDEN'));
    }
    next();
  };
};

/**
 * Factory de middleware para verificar propiedad del recurso o rol de administrador
 * 
 * @param userIdField - Nombre del parámetro de ruta que contiene el ID del usuario propietario
 * @returns Middleware de Express que verifica si el usuario es el propietario o es administrador
 * 
 * @example
 * // Uso en una ruta
 * router.put('/users/:id', isOwnerOrAdmin('id'), userController.update);
 */
export const isOwnerOrAdmin = (userIdField = 'id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Si es administrador, permitir acceso
    if (req.user?.role === 'ADMIN') {
      return next();
    }
    
    // Verificar si el ID del usuario autenticado coincide con el ID en los parámetros
    const userId = req.params[userIdField];
    if (req.user?.userId !== userId) {
      return next(createError('No tienes permisos para acceder a este recurso', 403, 'FORBIDDEN'));
    }
    
    next();
  };
};
