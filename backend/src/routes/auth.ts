/**
 * Módulo de rutas de autenticación
 * Define los endpoints para:
 * - Registro de usuarios
 * - Inicio de sesión local y con Google
 * - Gestión de perfiles de usuario
 * - Cierre de sesión
 * - Restablecimiento de contraseña
 */

// Importación de dependencias
import { Router, Request, Response, NextFunction } from 'express'; // Tipos de Express
import { body, validationResult } from 'express-validator'; // Validación de datos de entrada

// Controladores
import { 
  loginWithGoogle, 
  resetPassword,
  getProfile,
  logout,
  registerHandler,
  loginHandler
} from '../controllers/authController';

// Middleware de autenticación
import { authenticate } from '../middleware/auth'; // Middleware para proteger rutas

// Crear enrutador
const router = Router();

/**
 * Rutas públicas que no requieren autenticación
 * Estas rutas están excluidas del middleware de autenticación
 */
export const publicRoutes = [
  { path: '/api/register', method: 'POST' },        // Registro de usuarios
  { path: '/api/login', method: 'POST' },          // Inicio de sesión local
  { path: '/api/google-login', method: 'POST' },   // Inicio de sesión con Google
  { path: '/api/reset-password', method: 'POST' }, // Restablecimiento de contraseña
];

/**
 * Validaciones para el registro de usuarios
 * Se ejecutan antes de que la solicitud llegue al controlador
 */
const registerValidations = [
  // Validación del campo 'name'
  body('name')
    .trim() // Elimina espacios en blanco al inicio y final
    .isLength({ min: 2, max: 50 }) // Longitud entre 2 y 50 caracteres
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  // Validación del campo 'email'
  body('email')
    .isEmail() // Debe ser un correo electrónico válido
    .withMessage('Por favor ingresa un correo electrónico válido')
    .normalizeEmail(), // Normaliza el formato del correo
  
  // Validación del campo 'password'
  body('password')
    .isLength({ min: 8 }) // Mínimo 8 caracteres
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/) // Debe contener al menos un número
    .withMessage('La contraseña debe contener al menos un número')
];

/**
 * Validaciones para el inicio de sesión
 */
const loginValidations = [
  // Validación del campo 'email'
  body('email')
    .isEmail() // Debe ser un correo electrónico válido
    .withMessage('Por favor ingresa un correo electrónico válido')
    .normalizeEmail(), // Normaliza el formato del correo
  
  // Validación del campo 'password'
  body('password')
    .notEmpty() // No debe estar vacío
    .withMessage('La contraseña es requerida')
];

/**
 * Middleware para validar los datos de entrada
 * @param validations - Array de validaciones a aplicar
 * @returns Middleware de Express que valida los datos y maneja los errores
 */
const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ejecutar todas las validaciones en paralelo
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Obtener los errores de validación
    const errors = validationResult(req);
    
    // Si no hay errores, continuar al siguiente middleware
    if (errors.isEmpty()) {
      return next();
    }
    
    // Si hay errores, responder con código 400 y los mensajes de error
    res.status(400).json({ 
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details: errors.array()
      }
    });
  };
};

/**
 * Rutas de autenticación
 */

// Ruta para registro de usuarios
router.post('/register', validate(registerValidations), registerHandler);

// Ruta para inicio de sesión local
router.post('/login', validate(loginValidations), loginHandler);

// Ruta para inicio de sesión con Google OAuth
router.post('/google-login', loginWithGoogle);

// Ruta para restablecer contraseña
router.post('/reset-password', resetPassword);

// Ruta protegida para obtener el perfil del usuario
router.get('/profile', authenticate, getProfile);

// Ruta protegida para cerrar sesión
router.post('/logout', authenticate, logout);

export default router;
