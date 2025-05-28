"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Función para extraer el mensaje de error de la respuesta
  const extractErrorMessage = (error: any): string => {
    console.log('Error recibido:', error); // Para depuración
    
    // Si es un string, lo devolvemos directamente
    if (typeof error === 'string') return error;
    
    // Si es un objeto Error, devolvemos su mensaje
    if (error instanceof Error) return error.message;
    
    // Si tiene una propiedad message
    if (error?.message) return error.message;
    
    // Si es un objeto de respuesta de la API
    if (error?.data?.message) return error.data.message;
    
    // Si es un objeto de respuesta de la API (formato alternativo)
    if (error?.response?.data?.message) return error.response.data.message;
    
    // Si es un objeto, intentamos convertirlo a string
    if (typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch (e) {
        return 'Error desconocido';
      }
    }
    
    // Por defecto
    return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validación básica del lado del cliente
    if (!email || !password || !name) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Si no se puede parsear la respuesta como JSON
        throw new Error('La respuesta del servidor no es válida.');
      }

      if (!response.ok) {
        // Extraer el mensaje de error de la respuesta
        let errorMessage = extractErrorMessage(data);
        
        // Mapear mensajes de error comunes a mensajes más amigables
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('ya está registrado') || errorMessage.includes('already exists')) {
            errorMessage = 'Este correo electrónico ya está registrado. ¿Quieres iniciar sesión en su lugar?';
          } else if (errorMessage.includes('contraseña') || errorMessage.includes('password')) {
            errorMessage = 'La contraseña no cumple con los requisitos mínimos.';
          } else if (errorMessage.includes('correo electrónico') || errorMessage.includes('email') || errorMessage.includes('e-mail')) {
            errorMessage = 'Por favor, introduce un correo electrónico válido.';
          } else if (errorMessage.includes('validation') || errorMessage.includes('validación')) {
            errorMessage = 'Por favor, verifica que todos los campos sean correctos.';
          }
        } else {
          errorMessage = 'Error al procesar la solicitud. Por favor, inténtalo de nuevo.';
        }
        
        throw new Error(errorMessage);
      }

      // Registro exitoso, redirigir a inicio de sesión
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      console.error('Error en el registro:', err);
      // Extraer y mostrar el mensaje de error de manera segura
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage || 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    try {
      // Usar NextAuth para la autenticación con proveedores
      await signIn(provider, { callbackUrl: '/' });
    } catch (err) {
      console.error(`Error en autenticación con ${provider}:`, err);
      setError(`Error al iniciar sesión con ${provider}. Por favor, inténtalo de nuevo.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              inicia sesión en tu cuenta existente
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error.includes('¿Quieres iniciar sesión') ? '¡Ups! Cuenta existente' : 'Error en el registro'}
                </h3>
                <div className="mt-1 text-sm text-red-700 space-y-1">
                  <p>{error}</p>
                  {error.includes('¿Quieres iniciar sesión') && (
                    <div className="mt-2">
                      <Link 
                        href="/auth/login" 
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                      >
                        Ir a inicio de sesión
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Registrarse
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúa con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Regístrate con Google</span>
                  <FaGoogle className="h-5 w-5" />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Regístrate con Facebook</span>
                  <FaFacebook className="h-5 w-5 text-blue-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
