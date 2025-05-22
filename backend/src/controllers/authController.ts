import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as authService from '../services/authService';

// Configuración del cliente Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Controlador para registrar usuario local
 * Llama al servicio de registro y responde con token
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const token = await authService.registerUser(name, email, password);
    res.status(201).json({ token });
  } catch (error) {
    next(error); // Pasa error a middleware global
  }
};

/**
 * Controlador para login local
 * Llama al servicio de login y responde con token
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const token = await authService.loginUser(email, password);
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para restablecer contraseña
 * Llama al servicio y responde mensaje de éxito
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;
    await authService.resetUserPassword(email, newPassword);
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para login con Google OAuth
 * Verifica token con Google, crea usuario si no existe y responde JWT
 */
export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: 'Token inválido' });

    const jwtToken = await authService.findOrCreateGoogleUser(payload.email, payload.name || 'Google User');
    res.status(200).json({ token: jwtToken });
  } catch (error) {
    next(error);
  }
};
