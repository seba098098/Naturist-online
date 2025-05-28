/**
 * Módulo de cliente de Prisma
 * 
 * Este módulo exporta una instancia única de PrismaClient que debe ser utilizada
 * en toda la aplicación para interactuar con la base de datos. Esto asegura que
 * haya una única conexión a la base de datos durante el ciclo de vida de la aplicación.
 * 
 * @module prisma/client
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client Documentation}
 */

import { PrismaClient } from '@prisma/client';

/**
 * Instancia única de PrismaClient para toda la aplicación.
 * 
 * Esta instancia se conecta a la base de datos usando la URL definida en la
 * variable de entorno DATABASE_URL. La conexión se establece automáticamente
 * cuando se realiza la primera consulta.
 * 
 * @example
 * // Uso típico en un controlador o servicio
 * import prisma from '../prisma/client';
 * 
 * async function getUsers() {
 *   return await prisma.user.findMany();
 * }
 */
const prisma = new PrismaClient({
  // Opciones adicionales de PrismaClient pueden ir aquí
  // Por ejemplo, para habilitar logs en desarrollo:
  // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Exportar la instancia de PrismaClient
export default prisma;