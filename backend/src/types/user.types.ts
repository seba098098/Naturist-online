import { AuthProvider, Role } from '@prisma/client';

/**
 * Interfaz que representa un usuario en el sistema
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  auth_provider: AuthProvider;
  created_at: Date;
  updated_at: Date;
  avatar_url: string | null;
  email_verified: boolean;
}

/**
 * Interfaz para la creación de un usuario
 */
export interface CreateUserData {
  name: string;
  email: string;
  password_hash: string;
  role?: Role;
  auth_provider: AuthProvider;
  email_verified?: boolean;
  avatar_url?: string;
}

/**
 * Interfaz para la respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}
