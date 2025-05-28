'use client';

import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

/**
 * Hook personalizado para manejar la autenticación
 * Proporciona métodos y estados relacionados con la sesión del usuario
 * 
 * @returns {Object} Objeto con el usuario, estado de carga, estado de autenticación y método de actualización
 * @property {Object} user - Datos del usuario autenticado
 * @property {boolean} isLoading - Indica si la sesión se está cargando
 * @property {boolean} isAuthenticated - Indica si el usuario está autenticado
 * @property {Function} update - Función para actualizar la sesión
 * @property {Function} refreshSession - Función para forzar la actualización de la sesión
 */
export const useAuth = () => {
  const { data: session, status, update } = useSession();

  /**
   * Actualiza la sesión forzando una nueva solicitud al servidor
   * @returns {Promise<Session | null>} La sesión actualizada o null si hay un error
   */
  const refreshSession = async (): Promise<Session | null> => {
    try {
      const updatedSession = await update();
      return updatedSession || null;
    } catch (error) {
      console.error('Error al actualizar la sesión:', error);
      return null;
    }
  };
  
  return {
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    update,
    refreshSession,
  };
};

/**
 * Tipo que representa el retorno del hook useAuth
 */
export type UseAuthReturn = ReturnType<typeof useAuth>;
