import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar que el usuario autenticado sea admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: Solo administradores' });
  }
  next();
};
