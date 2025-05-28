import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { signOut } from 'next-auth/react';

// Tipos para errores de la API
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// Configuración base de axios
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Si el error es 401 (No autorizado) y no es una solicitud de renovación de token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar renovar el token aquí si es necesario
        // const newToken = await refreshToken();
        // originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // return api(originalRequest);
        
        // Si no se puede renovar, cerrar sesión
        await signOut({ redirect: false });
        window.location.href = '/auth/login';
        return Promise.reject(error);
      } catch (refreshError) {
        await signOut({ redirect: false });
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Para otros errores, devolver un objeto de error consistente
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Error desconocido',
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(apiError);
  }
);

/**
 * Función para realizar peticiones HTTP con manejo de errores
 */
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  try {
    const response = await api.request<T>(config);
    return {
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    // Si es un error de axios, ya está manejado por el interceptor
    if (axios.isAxiosError(error)) {
      throw error;
    }
    
    // Para errores no manejados
    throw {
      message: error?.message || 'Error de red',
      status: 500,
    } as ApiError;
  }
};

/**
 * Función para realizar peticiones GET
 */
export const get = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  return apiRequest<T>({
    ...config,
    method: 'GET',
    url,
  });
};

/**
 * Función para realizar peticiones POST
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  return apiRequest<T>({
    ...config,
    method: 'POST',
    url,
    data,
  });
};

/**
 * Función para realizar peticiones PUT
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  return apiRequest<T>({
    ...config,
    method: 'PUT',
    url,
    data,
  });
};

/**
 * Función para realizar peticiones DELETE
 */
export const del = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  return apiRequest<T>({
    ...config,
    method: 'DELETE',
    url,
  });
};
