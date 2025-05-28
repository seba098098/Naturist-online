'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

// Esquema de validación para el formulario de inicio de sesión
const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Componente de formulario de inicio de sesión
 * Maneja la autenticación local con credenciales
 */
export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar el error del campo cuando el usuario escribe
    if (formErrors[name as keyof LoginFormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Valida el formulario usando el esquema de validación
   */
  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce<Record<string, string>>((acc, curr) => {
          const key = curr.path[0] as string;
          acc[key] = curr.message;
          return acc;
        }, {});
        setFormErrors(errors);
      }
      return false;
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar el formulario
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result?.error) {
        // Manejar errores específicos del servidor si es necesario
        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Correo electrónico o contraseña incorrectos' 
          : 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
        
        setError(errorMessage);
      } else {
        // Redirigir al dashboard después de un inicio de sesión exitoso
        router.push('/dashboard');
        router.refresh(); // Asegurar que la navegación se complete
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="text-gray-500">Ingresa tus credenciales para continuar</p>
      </div>
      
      {/* Mensaje de error general */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            aria-invalid={!!formErrors.email}
            aria-describedby={formErrors.email ? 'email-error' : undefined}
            className={formErrors.email ? 'border-red-500' : ''}
          />
          {formErrors.email && (
            <p id="email-error" className="text-sm text-red-500 mt-1">
              {formErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <a 
              href="/auth/forgot-password" 
              className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              tabIndex={isLoading ? -1 : 0}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            aria-invalid={!!formErrors.password}
            aria-describedby={formErrors.password ? 'password-error' : undefined}
            className={formErrors.password ? 'border-red-500' : ''}
          />
          {formErrors.password && (
            <p id="password-error" className="text-sm text-red-500 mt-1">
              {formErrors.password}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="mr-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Iniciando sesión...
            </>
          ) : 'Iniciar sesión'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">O continúa con</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn('google')}
          disabled={isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>

      <div className="text-center text-sm">
        ¿No tienes una cuenta?{' '}
        <a href="/auth/register" className="font-medium text-blue-600 hover:underline">
          Regístrate
        </a>
      </div>
    </div>
  );
}
