import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError, unauthorized } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        iat: number;
        exp: number;
      };
    }
  }
}

// Clave secreta para firmar y verificar tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware para verificar el token JWT en las peticiones
 * Extrae el token del header Authorization o de las cookies
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
 * Middleware para verificar que el usuario autenticado sea admin
 */
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(createError('Acceso denegado: Se requieren permisos de administrador', 403, 'FORBIDDEN'));
  }
  next();
};

/**
 * Middleware para verificar roles específicos
 * @param roles - Array de roles permitidos
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
 * Middleware para verificar propiedad o rol de administrador
 * @param userIdField - Nombre del campo que contiene el ID del usuario en los parámetros de la ruta
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
