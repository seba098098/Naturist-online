import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

// Variables de entorno para secretos y configuración
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SALT_ROUNDS = 10;

/**
 * Registra un nuevo usuario local
 * - Verifica si email ya existe
 * - Hashea contraseña
 * - Crea usuario en la base de datos
 * - Genera token JWT
 */
export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email ya registrado');

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.users.create({
    data: { name, email, password_hash, auth_provider: 'LOCAL' },
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return token;
};

/**
 * Login de usuario local
 * - Busca usuario por email
 * - Valida que sea auth local y contraseña correcta
 * - Genera token JWT
 */
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || user.auth_provider !== 'LOCAL') throw new Error('Usuario no registrado localmente');

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new Error('Contraseña incorrecta');

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return token;
};

/**
 * Restablece la contraseña de un usuario local
 * - Verifica usuario y tipo de auth
 * - Hashea nueva contraseña y actualiza DB
 */
export const resetUserPassword = async (email: string, newPassword: string) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || user.auth_provider !== 'LOCAL') throw new Error('Usuario no encontrado o no es local');

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.users.update({ where: { email }, data: { password_hash: newHash } });
};

/**
 * Encuentra o crea usuario con Google OAuth
 * - Busca por email
 * - Si no existe, crea con auth_provider GOOGLE
 * - Genera token JWT
 */
export const findOrCreateGoogleUser = async (email: string, name: string) => {
  let user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.users.create({
      data: { name, email, password_hash: '', auth_provider: 'GOOGLE' },
    });
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return token;
};
