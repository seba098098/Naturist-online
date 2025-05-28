/**
 * Servicio de autenticación
 * Maneja la lógica de negocio relacionada con la autenticación de usuarios:
 * - Registro de nuevos usuarios
 * - Inicio de sesión con credenciales locales
 * - Autenticación con proveedores OAuth (Google)
 * - Gestión de tokens JWT
 * - Restablecimiento de contraseñas
 */

// Importación de dependencias
import bcrypt from 'bcrypt'; // Para hashear y comparar contraseñas
import jwt from 'jsonwebtoken'; // Para generar y verificar tokens JWT
import { PrismaClient, AuthProvider, Role } from '@prisma/client'; // Tipos de Prisma
import { createError } from '../middleware/errorHandler'; // Utilidad para crear errores personalizados

// Inicialización del cliente de Prisma para interactuar con la base de datos
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Interfaz que representa un usuario en el sistema
 * Incluye todos los campos relevantes de la entidad User de Prisma
 */
type User = {
  id: number;                     // Identificador único del usuario
  name: string;                   // Nombre completo del usuario
  email: string;                  // Correo electrónico (único)
  password_hash: string;          // Hash de la contraseña (solo para autenticación local)
  role: Role;                     // Rol del usuario (ADMIN, USER, etc.)
  auth_provider: AuthProvider;    // Proveedor de autenticación (LOCAL, GOOGLE, etc.)
  created_at: Date;               // Fecha de creación del usuario
  updated_at: Date;               // Fecha de última actualización
  avatar_url?: string | null;     // URL de la imagen de perfil (opcional)
  email_verified?: boolean;       // Indica si el correo electrónico ha sido verificado
};

/**
 * Configuración de la autenticación
 * Las variables de entorno tienen valores por defecto para desarrollo,
 * pero deben configurarse en producción.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Clave secreta para firmar los tokens JWT
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';     // Tiempo de expiración de los tokens
const SALT_ROUNDS = 10; // Número de rondas de hashing para bcrypt (mayor = más seguro pero más lento)

/**
 * Interfaz para la respuesta de autenticación
 * Contiene el token JWT y los datos del usuario (sin la contraseña)
 */
export interface AuthResponse {
  token: string;                     // Token JWT para autenticación
  user: Omit<User, 'password_hash'>;  // Datos del usuario sin la contraseña
}

/**
 * Registra un nuevo usuario en el sistema con autenticación local
 * @param name - Nombre completo del usuario
 * @param email - Correo electrónico (debe ser único)
 * @param password - Contraseña en texto plano (será hasheada)
 * @returns Promesa que resuelve con el token JWT y los datos del usuario
 * @throws {Error} Si el correo ya está registrado o hay un error en el servidor
 */
export const registerUser = async (
  name: string, 
  email: string, 
  password: string
): Promise<AuthResponse> => {
  console.log(`[AUTH_SERVICE] Iniciando registro para: ${email}`);
  
  // Verificar si el usuario existe
  console.log(`[AUTH_SERVICE] Verificando si el usuario ya existe: ${email}`);
  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`[AUTH_SERVICE] Error: El correo ${email} ya está registrado`);
    throw createError('El correo electrónico ya está registrado', 400, 'AUTH_ERROR');
  }

  // Hashear la contraseña
  console.log(`[AUTH_SERVICE] Hasheando contraseña para: ${email}`);
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Crear el usuario
  console.log(`[AUTH_SERVICE] Creando usuario en la base de datos: ${email}`);
  const user = await prisma.users.create({
    data: { 
      name, 
      email, 
      password_hash, 
      auth_provider: AuthProvider.LOCAL,
      role: 'USER' // Rol por defecto
    },
  });
  
  console.log(`[AUTH_SERVICE] Usuario creado con ID: ${user.id}`);

  // Generar token JWT - Asegurarse de que el ID sea un string
  console.log(`[AUTH_SERVICE] Generando token JWT para el usuario ID: ${user.id}`);
  const token = generateToken(user.id.toString(), user.role);
  
  // Devolver token y datos del usuario (sin la contraseña)
  const { password_hash: __, ...userWithoutPassword } = user;
  
  console.log(`[AUTH_SERVICE] Registro completado para: ${email}`);
  return { token, user: userWithoutPassword };
};

/**
 * Autentica a un usuario con credenciales locales (email/contraseña)
 * @param email - Correo electrónico del usuario
 * @param password - Contraseña en texto plano
 * @returns Promesa que resuelve con el token JWT y los datos del usuario
 * @throws {Error} Si las credenciales son incorrectas, el usuario no existe o hay un error
 */
export const loginUser = async (
  email: string, 
  password: string
): Promise<AuthResponse> => {
  console.log(`[AUTH_SERVICE] Iniciando proceso de login para: ${email}`);
  
  // Buscar usuario
  console.log(`[AUTH_SERVICE] Buscando usuario: ${email}`);
  const user = await prisma.users.findUnique({ where: { email } });
  
  // Verificar si el usuario existe
  if (!user) {
    console.log(`[AUTH_SERVICE] Error: No existe cuenta para el correo: ${email}`);
    throw createError('No existe una cuenta con este correo electrónico', 401, 'AUTH_ERROR');
  }
  
  console.log(`[AUTH_SERVICE] Usuario encontrado. ID: ${user.id}, Proveedor: ${user.auth_provider}`);
  
  // Verificar si el usuario usa autenticación local
  if (user.auth_provider !== AuthProvider.LOCAL) {
    console.log(`[AUTH_SERVICE] Error: Método de autenticación incorrecto para: ${email}. Usa: ${user.auth_provider}`);
    throw createError('Por favor, inicia sesión con el método de autenticación correcto', 401, 'AUTH_ERROR');
  }

  // Verificar la contraseña
  console.log(`[AUTH_SERVICE] Verificando contraseña para: ${email}`);
  const passwordToCompare = user.password_hash || '';
  const isPasswordValid = await bcrypt.compare(password, passwordToCompare);
  
  if (!isPasswordValid) {
    console.log(`[AUTH_SERVICE] Error: Contraseña incorrecta para: ${email}`);
    throw createError('Contraseña incorrecta', 401, 'AUTH_ERROR');
  }

  // Generar token JWT - Asegurarse de que el ID sea un string
  console.log(`[AUTH_SERVICE] Generando token JWT para el usuario ID: ${user.id}`);
  const token = generateToken(user.id.toString(), user.role);
  
  // Devolver token y datos del usuario (sin la contraseña)
  const { password_hash, ...userWithoutPassword } = user;
  
  console.log(`[AUTH_SERVICE] Autenticación exitosa para: ${email}`);
  return { token, user: userWithoutPassword };
};

/**
 * Obtiene el perfil de un usuario por su ID
 * @param userId - ID del usuario cuyo perfil se desea obtener
 * @returns Promesa que resuelve con los datos del perfil del usuario (sin la contraseña)
 * @throws {Error} Si el usuario no existe o hay un error en la base de datos
 */
export const getUserProfile = async (userId: number) => {
  // Buscar usuario por ID
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      auth_provider: true,
      created_at: true,
      updated_at: true
    }
  });
  return user;
};

/**
 * Restablece la contraseña de un usuario con autenticación local
 * @param email - Correo electrónico del usuario
 * @param newPassword - Nueva contraseña en texto plano (será hasheada)
 * @returns Promesa que resuelve cuando la contraseña ha sido actualizada
 * @throws {Error} Si el usuario no existe, no usa autenticación local o hay un error
 */
export const resetUserPassword = async (email: string, newPassword: string): Promise<void> => {
  // Buscar usuario
  const user = await prisma.users.findUnique({ where: { email } });
  
  // Verificar si el usuario existe y usa autenticación local
  if (!user || user.auth_provider !== AuthProvider.LOCAL) {
    throw createError('Usuario no encontrado o no usa autenticación local', 404, 'AUTH_ERROR');
  }

  // Hashear la nueva contraseña
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  // Actualizar la contraseña
  await prisma.users.update({ 
    where: { email }, 
    data: { password_hash: newHash } 
  });
};

/**
 * Busca un usuario por su correo electrónico o lo crea si no existe (para OAuth)
 * @param email - Correo electrónico del usuario
 * @param name - Nombre completo del usuario
 * @param avatar - URL de la imagen de perfil (opcional)
 * @returns Promesa que resuelve con el token JWT y los datos del usuario
 * @throws {Error} Si hay un error al buscar o crear el usuario
 */
export const findOrCreateGoogleUser = async (
  email: string, 
  name: string, 
  avatar?: string | null
): Promise<AuthResponse> => {
  // Buscar usuario existente
  let user = await prisma.users.findUnique({ 
    where: { email }
  });
  
  // Si no existe, crearlo
  if (!user) {
    user = await prisma.users.create({
      data: { 
        name, 
        email, 
        password_hash: '', // Sin contraseña para autenticación por OAuth
        auth_provider: AuthProvider.GOOGLE,
        avatar_url: avatar || null,
        role: 'USER', // Rol por defecto
        email_verified: true
      },
    });
  }
  
  // Si el usuario existe pero con otro proveedor
  if (user.auth_provider !== AuthProvider.GOOGLE) {
    throw createError(
      'Este correo ya está registrado con otro método de autenticación', 
      400, 
      'AUTH_ERROR'
    );
  }

  // Actualizar la última vez que inició sesión
  await prisma.users.update({
    where: { id: user.id },
    data: { updated_at: new Date() }
  });

  // Generar token JWT - Asegurarse de que el ID sea un string
  const token = generateToken(user.id.toString(), user.role);
  
  // Devolver token y datos del usuario (sin la contraseña)
  const { password_hash, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

/**
 * Genera un token JWT para un usuario autenticado
 * @param userId - ID del usuario (se convierte a string si es necesario)
 * @param role - Rol del usuario para incluir en el payload del token
 * @returns Token JWT firmado
 * @throws {Error} Si hay un error al generar el token
 */
function generateToken(userId: string | number, role: string): string {
  // Asegurarse de que el userId sea un string
  const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
  console.log(`[AUTH_SERVICE] Generando token para userId: ${userId}, rol: ${role}`);
  
  // Crear payload del token
  const payload = { 
    userId: userIdStr, 
    role,
    iat: Math.floor(Date.now() / 1000) // Fecha de emisión
  };
  
  // Configurar opciones del token con un valor numérico para evitar problemas de tipado
  const options = { 
    expiresIn: 60 * 60 * 24 * 7, // 7 días en segundos
    algorithm: 'HS256' as const
  };
  
  console.log(`[AUTH_SERVICE] Payload del token:`, JSON.stringify(payload));
  
  try {
    const token = jwt.sign(payload as object, JWT_SECRET, options);
    console.log(`[AUTH_SERVICE] Token generado exitosamente`);
    return token;
  } catch (error) {
    console.error(`[AUTH_SERVICE] Error al generar el token:`, error);
    throw error;
  }
};
