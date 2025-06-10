/**
 * Servicio de autenticación
 * Maneja la lógica de negocio relacionada con la autenticación de usuarios
 */

// Importación de dependencias
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, AuthProvider, Role } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { 
  User, 
  CreateUserData, 
  AuthResponse 
} from '../types/user.types';
import { 
  JWT_CONFIG, 
  BCRYPT_CONFIG, 
  AUTH_ERRORS 
} from '../constants/auth.constants';

// Validar variables de entorno
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Inicialización del cliente de Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Extender el tipo de usuario para incluir los campos adicionales
type UserWithProfile = User & {
  avatar_url?: string | null;
  email_verified: boolean;
  [key: string]: any; // Para permitir propiedades adicionales
};

/**
 * Genera un token JWT para un usuario autenticado
 * @param userId - ID del usuario (se convierte a string si es necesario)
 * @param role - Rol del usuario para incluir en el payload del token
 * @returns Token JWT firmado
 * @throws {Error} Si hay un error al generar el token
 */
const generateToken = (userId: string | number, role: string): string => {
  const userIdStr = userId.toString();
  logger.info(`Generando token para userId: ${userIdStr}, rol: ${role}`);
  
  // Asegurarse de que JWT_SECRET esté definido
  if (!JWT_SECRET) {
    const error = new Error('JWT_SECRET no está configurado');
    logger.error('Error en generateToken:', error);
    throw error;
  }
  
  try {
    const payload = { 
      userId: userIdStr, 
      role,
      iat: Math.floor(Date.now() / 1000) 
    };
    
    // Convertir '7d' a segundos (7 días = 604800 segundos)
    const expiresInSeconds = 7 * 24 * 60 * 60; // 7 días en segundos
    
    const options: jwt.SignOptions = { 
      expiresIn: expiresInSeconds, // Usar segundos en lugar de string
      algorithm: 'HS256'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);
    
    logger.debug('Token generado exitosamente');
    return token;
  } catch (error) {
    logger.error('Error al generar el token', { error });
    throw createError('Error al generar el token de autenticación', 500, 'AUTH_ERROR');
  }
};

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
  logger.info(`Iniciando registro para: ${email}`);
  
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.users.findUnique({ 
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      logger.warn(`Intento de registro con correo ya existente: ${email}`);
      throw createError(AUTH_ERRORS.EMAIL_ALREADY_EXISTS, 400, 'AUTH_ERROR');
    }
    
    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, BCRYPT_CONFIG.SALT_ROUNDS);
    
    // Crear el usuario en una transacción
    const user = await prisma.$transaction(async (tx) => {
      // Usar una aserción de tipo para los datos del usuario
      const userData = {
        name,
        email,
        password_hash: passwordHash,
        role: 'USER' as const,
        auth_provider: 'LOCAL' as const,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Crear el usuario con los datos tipados
      const newUser = await tx.users.create({
        data: userData as any, // Usamos 'as any' temporalmente para evitar problemas de tipos
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          auth_provider: true,
          created_at: true,
          updated_at: true
          // Nota: No incluimos avatar_url y email_verified aquí ya que no son reconocidos por el tipo
        }
      });
      
      // Añadir los campos personalizados manualmente
      return {
        ...newUser,
        avatar_url: null,
        email_verified: false
      } as any; // Usamos 'as any' temporalmente
    });
    
    // Generar token JWT
    const token = generateToken(user.id, user.role);
    
    logger.info(`Usuario registrado exitosamente: ${user.id}`);
    
    return {
      token,
      user: {
        ...user,
        // Asegurarse de que los campos opcionales tengan valores por defecto
        avatar_url: (user as any).avatar_url || null,
        email_verified: (user as any).email_verified ?? false
      }
    };
  } catch (error) {
    logger.error('Error en registerUser', { error, email });
    throw error;
  }
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
  
  // Asegurarse de que todos los campos requeridos estén presentes
  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    auth_provider: user.auth_provider,
    created_at: user.created_at,
    updated_at: user.updated_at,
    avatar_url: ('avatar_url' in user ? (user as any).avatar_url : null) as string | null,
    email_verified: ('email_verified' in user ? (user as any).email_verified : false) as boolean
  };
  
  console.log(`[AUTH_SERVICE] Autenticación exitosa para: ${email}`);
  return { token, user: userResponse };
};

/**
 * Obtiene el perfil de un usuario por su ID
 * @param userId - ID del usuario cuyo perfil se desea obtener
 * @returns Promesa que resuelve con los datos del perfil del usuario (sin la contraseña)
 * @throws {Error} Si el usuario no existe o hay un error en la base de datos
 */
export const getUserProfile = async (userId: number) => {
  // Buscar usuario por ID
  let user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      password_hash: true,
      role: true,
      auth_provider: true,
      created_at: true,
      updated_at: true,
      avatar_url: true,
      email_verified: true
    }
  }) as any; // Usar aserción de tipo temporalmente
  
  if (!user) {
    throw createError('Usuario no encontrado', 404, 'NOT_FOUND');
  }
  
  // Asegurarse de que los campos opcionales tengan valores por defecto
  return {
    ...user,
    // Usar aserción de tipo para acceder a los campos personalizados
    avatar_url: (user as any).avatar_url || null,
    email_verified: (user as any).email_verified ?? false
  } as UserWithProfile;
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
  const newHash = await bcrypt.hash(newPassword, BCRYPT_CONFIG.SALT_ROUNDS);
  
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
  try {
    console.log(`[AUTH_SERVICE] Buscando usuario con email: ${email}`);
    
    // Validar email
    if (!email || !email.includes('@')) {
      console.error('[AUTH_SERVICE] Error: Email no válido');
      throw createError('El correo electrónico no es válido', 400, 'VALIDATION_ERROR');
    }

    // Buscar usuario existente
    let user = await prisma.users.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        role: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
        avatar_url: true,
        email_verified: true
      }
    }) as any; // Usar aserción de tipo temporalmente
    
    console.log(`[AUTH_SERVICE] Usuario ${user ? 'encontrado' : 'no encontrado'}: ${email}`);
    
    // Si el usuario existe pero con otro proveedor
    if (user && user.auth_provider !== AuthProvider.GOOGLE) {
      console.error(`[AUTH_SERVICE] Error: El correo ${email} ya está registrado con otro método de autenticación`);
      throw createError(
        'Este correo ya está registrado con otro método de autenticación. Por favor, inicia sesión con el método original.', 
        400, 
        'AUTH_ERROR'
      );
    }
    
    // Si no existe, crearlo
    if (!user) {
      console.log(`[AUTH_SERVICE] Creando nuevo usuario con Google: ${email}`);
      
      // Validar nombre
      const displayName = name?.trim() || email.split('@')[0];
      
      try {
        // Crear el usuario con los campos correctos
        const userData: any = {
          name: displayName,
          email,
          password_hash: '', // Cadena vacía para OAuth
          role: 'USER',
          auth_provider: AuthProvider.GOOGLE,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
          ...(avatar && { avatar_url: avatar }) // Agregar avatar_url solo si se proporciona
        };
        
        user = await prisma.users.create({
          data: userData,
        });
        
        console.log(`[AUTH_SERVICE] Usuario creado exitosamente con ID: ${user.id}`);
      } catch (error) {
        console.error('[AUTH_SERVICE] Error al crear usuario:', error);
        throw createError('Error al crear el usuario', 500, 'DATABASE_ERROR');
      }
    } else {
      // Actualizar datos del usuario existente si es necesario
      const updateData: any = { updated_at: new Date() };
      
      // Actualizar avatar si no tiene uno y se proporciona uno nuevo
      if (!user.avatar_url && avatar) {
        updateData.avatar_url = avatar;
      }
      
      // Actualizar nombre si está vacío
      if (!user.name || user.name === 'Usuario de Google') {
        updateData.name = name || email.split('@')[0];
      }
      
      if (Object.keys(updateData).length > 1) { // Si hay más que solo updated_at
        try {
          user = await prisma.users.update({
            where: { id: user.id },
            data: updateData
          });
          console.log(`[AUTH_SERVICE] Usuario actualizado: ${user.id}`);
        } catch (error) {
          console.error('[AUTH_SERVICE] Error al actualizar usuario:', error);
          // No lanzamos error, continuamos con los datos existentes
        }
      }
    }

    // Generar token JWT - Asegurarse de que el ID sea un string
    console.log(`[AUTH_SERVICE] Generando token JWT para usuario ID: ${user.id}`);
    const token = generateToken(user.id.toString(), user.role);
    
    // Devolver token y datos del usuario (sin la contraseña)
    const { password_hash, ...userWithoutPassword } = user;
    
    // Asegurarse de que todos los campos requeridos estén presentes
    const userResponse: UserWithProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      auth_provider: user.auth_provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Usar aserción de tipo para acceder a los campos personalizados
      avatar_url: (user as any).avatar_url || null,
      email_verified: (user as any).email_verified ?? false
    };
    
    return { 
      token, 
      user: userResponse
    };
  } catch (error) {
    console.error('[AUTH_SERVICE] Error en findOrCreateGoogleUser:', error);
    throw error; // Re-lanzar el error para que lo maneje el controlador
  }
};
