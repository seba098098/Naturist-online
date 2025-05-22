import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global para manejo de errores
 * Captura cualquier error no manejado y responde JSON
 */
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err); // Aquí puedes usar un logger avanzado

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({ error: message });
};
