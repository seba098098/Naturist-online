import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, Result, ValidationError } from 'express-validator';
import { 
  loginWithGoogle, 
  resetPassword,
  getProfile,
  logout,
  registerHandler,
  loginHandler
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rutas públicas
export const publicRoutes = [
  { path: '/api/register', method: 'POST' },
  { path: '/api/login', method: 'POST' },
  { path: '/api/google-login', method: 'POST' },
  { path: '/api/reset-password', method: 'POST' },
];

// Validaciones
const registerValidations = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Por favor ingresa un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número')
];

const loginValidations = [
  body('email')
    .isEmail()
    .withMessage('Por favor ingresa un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Middleware de validación
const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({ errors: errors.array() });
  };
};

// Rutas de autenticación
router.post('/register', validate(registerValidations), registerHandler);
router.post('/login', validate(loginValidations), loginHandler);

router.post('/google-login', loginWithGoogle);
router.post('/reset-password', resetPassword);

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
