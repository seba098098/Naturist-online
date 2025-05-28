/**
 * Controlador de autenticación
 * Maneja las peticiones HTTP relacionadas con la autenticación:
 * - Registro de usuarios
 * - Inicio de sesión con credenciales locales
 * - Autenticación con Google OAuth
 * - Cierre de sesión
 * - Obtención de perfil de usuario
 * - Restablecimiento de contraseña
 */

// Importación de dependencias
import { Request, Response, NextFunction } from 'express'; // Tipos de Express
import { OAuth2Client } from 'google-auth-library'; // Cliente de Google OAuth
import * as authService from '../services/authService'; // Servicio de autenticación
import { createError, unauthorized, ERROR_TYPES } from '../middleware/errorHandler'; // Utilidades para manejo de errores

/**
 * Configuración del cliente de Google OAuth
 * Se utiliza para verificar los tokens de autenticación de Google
 */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Controlador para el registro de nuevos usuarios
 * @param req - Objeto de solicitud de Express
 * @param res - Objeto de respuesta de Express
 * @param next - Función para pasar al siguiente middleware
 * @returns Respuesta JSON con el token JWT y los datos del usuario
 */
export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    console.log(`[REGISTER] Intento de registro para: ${email}`);
    
    const token = await authService.registerUser(name, email, password);
    console.log(`[REGISTER] Usuario registrado exitosamente: ${email}`);
    
    // Configura la cookie HTTP-only segura
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    };
    
    console.log(`[REGISTER] Configurando cookie para usuario: ${email}`);
    res.cookie('token', token, cookieOptions);
    
    console.log(`[REGISTER] Respuesta enviada para: ${email}`);
    res.status(201).json({ 
      success: true, 
      data: { 
        token,
        user: { name, email }
      } 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para el inicio de sesión con credenciales locales
 * @param req - Objeto de solicitud de Express (debe contener email y password)
 * @param res - Objeto de respuesta de Express
 * @param next - Función para pasar al siguiente middleware
 * @returns Respuesta JSON con el token JWT y los datos del usuario
 */
export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN] Intento de inicio de sesión para: ${email}`);
    
    if (!email || !password) {
      console.log('[LOGIN] Error: Faltan credenciales');
      return next(createError('Email y contraseña son requeridos', 400, 'VALIDATION_ERROR'));
    }

    try {
      console.log(`[LOGIN] Validando credenciales para: ${email}`);
      const { token, user } = await authService.loginUser(email, password);
      
      console.log(`[LOGIN] Credenciales válidas para: ${email}`);
      console.log(`[LOGIN] ID de usuario: ${user.id}, Rol: ${user.role}`);
      
      // Configura la cookie HTTP-only segura
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      };
      
      console.log(`[LOGIN] Configurando cookie para usuario: ${email}`);
      res.cookie('token', token, cookieOptions);
      
      console.log(`[LOGIN] Inicio de sesión exitoso para: ${email}`);
      res.status(200).json({ 
        success: true, 
        data: { 
          token,
          user: { 
            id: user.id,
            name: user.name, 
            email: user.email,
            role: user.role
          }
        } 
      });
    } catch (error: any) {
      console.error(`[LOGIN] Error durante el inicio de sesión para ${email}:`, error.message);
      
      if (error.type === 'AUTH_ERROR') {
        console.log(`[LOGIN] Autenticación fallida para: ${email} - ${error.message}`);
        return next(unauthorized('Correo o contraseña incorrectos'));
      }
      
      console.error(`[LOGIN] Error inesperado para ${email}:`, error);
      throw error; // Pasar otros errores al manejador de errores global
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para cerrar la sesión del usuario
 * Elimina la cookie de autenticación
 * @param _req - Objeto de solicitud de Express
 * @param res - Objeto de respuesta de Express
 * @returns Respuesta JSON indicando éxito
 */
export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' });
};

/**
 * Controlador para obtener el perfil del usuario autenticado
 * @param req - Objeto de solicitud de Express (debe contener el usuario en req.user)
 * @param res - Objeto de respuesta de Express
 * @param next - Función para pasar al siguiente middleware
 * @returns Respuesta JSON con los datos del perfil del usuario
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return next(unauthorized('No autorizado'));
    }
    
    const user = await authService.getUserProfile(userId);
    if (!user) {
      return next(unauthorized('No autorizado'));
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para restablecer la contraseña de un usuario
 * @param req - Objeto de solicitud de Express (debe contener email y newPassword)
 * @param res - Objeto de respuesta de Express
 * @param next - Función para pasar al siguiente middleware
 * @returns Respuesta JSON indicando éxito o error
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;
    await authService.resetUserPassword(email, newPassword);
    
    res.status(200).json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para el inicio de sesión con Google OAuth
 * Verifica el token de Google, crea el usuario si no existe y genera un JWT
 * @param req - Objeto de solicitud de Express (debe contener un token de Google)
 * @param res - Objeto de respuesta de Express
 * @param next - Función para pasar al siguiente middleware
 * @returns Respuesta JSON con el token JWT y los datos del usuario
 */
export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(createError('Token de Google es requerido', 400, 'VALIDATION_ERROR'));
    }

    const ticket = await googleClient.verifyIdToken({ 
      idToken: token, 
      audience: GOOGLE_CLIENT_ID 
    });
    
    const payload = ticket.getPayload();
    if (!payload?.email) {
return next(createError('Token de Google inválido', 400, ERROR_TYPES.UNAUTHORIZED));
    }

    const { token: jwtToken, user } = await authService.findOrCreateGoogleUser(
      payload.email, 
      payload.name || 'Usuario de Google',
      payload.picture
    );

    // Configura la cookie HTTP-only segura
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
    
    res.status(200).json({ 
      success: true, 
      data: { 
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url
        }
      } 
    });
  } catch (error) {
    console.error('Error en login con Google:', error);
    next(createError('Error al autenticar con Google', 500, ERROR_TYPES.INTERNAL_SERVER_ERROR));
  }
};
