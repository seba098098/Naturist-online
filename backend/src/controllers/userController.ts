import { Request, Response, NextFunction } from 'express';
import { prisma } from '..';
import { ERROR_TYPES } from '../middleware/errorHandler';

/**
 * @desc    Obtener todos los usuarios (solo administradores)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        auth_provider: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    next({
      statusCode: 500,
      message: 'Error al obtener los usuarios',
      errorType: ERROR_TYPES.INTERNAL_SERVER_ERROR,
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * @desc    Obtener un solo usuario por ID (solo administradores)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        auth_provider: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          type: ERROR_TYPES.NOT_FOUND,
          message: 'Usuario no encontrado'
        }
      });
    }


    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    next({
      statusCode: 500,
      message: 'Error al obtener el usuario',
      errorType: ERROR_TYPES.INTERNAL_SERVER_ERROR,
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
