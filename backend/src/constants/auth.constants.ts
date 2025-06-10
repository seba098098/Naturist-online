/**
 * Constantes relacionadas con la autenticación
 */

export const JWT_CONFIG = {
  EXPIRES_IN: '7d',
  COOKIE_NAME: 'token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.tudominio.com' : undefined
  }
};

export const BCRYPT_CONFIG = {
  SALT_ROUNDS: 10
};

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  EMAIL_ALREADY_EXISTS: 'El correo electrónico ya está registrado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_AUTH_PROVIDER: 'Método de autenticación no válido',
  ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER: 'Esta cuenta ya está registrada con otro método de autenticación'
};
