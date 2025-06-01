import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import { getUsers, getUserById } from '../controllers/userController';

// Extender la interfaz de Request para incluir user
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

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (solo administradores)
 * @access  Private/Admin
 */
router.get('/', authenticate, isAdmin, (req: Request, res: Response, next: NextFunction) => {
  getUsers(req, res, next);
});

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID (solo administradores)
 * @access  Private/Admin
 */
router.get('/:id', authenticate, isAdmin, (req: Request, res: Response, next: NextFunction) => {
  getUserById(req, res, next);
});

export default router;
