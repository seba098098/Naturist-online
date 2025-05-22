import { Router, Request, Response, NextFunction } from 'express';
import { register, login, loginWithGoogle, resetPassword } from '../controllers/authController';

const router = Router();

/**
 * Wrapper para manejar errores en funciones async
 * Pasa errores automáticamente a middleware global
 */
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Definición de rutas autenticación con asyncHandler
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/google-login', asyncHandler(loginWithGoogle));
router.post('/reset-password', asyncHandler(resetPassword));

export default router;
