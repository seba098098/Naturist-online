import { z } from 'zod';
import { AuthProvider } from '@prisma/client';

// Esquema para registro de usuario
export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

// Esquema para inicio de sesión
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

// Esquema para autenticación con Google
export const googleAuthSchema = z.object({
  token: z.string().min(1, 'El token de Google es requerido'),
  name: z.string().optional(),
  avatar: z.string().optional()
});

// Esquema para actualización de perfil
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  avatar_url: z.string().url('URL de avatar no válida').optional()
});

// Esquema para restablecimiento de contraseña
export const resetPasswordSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
});

// Tipos inferidos de los esquemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
