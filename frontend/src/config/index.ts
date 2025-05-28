import { Config } from './types';

const config: Config = {
  API_URL: 'http://localhost:4000'
};

// Mostrar la URL al inicio
console.log('Configuración inicial:');
console.log('API_URL:', config.API_URL);

// Verificar que la URL es válida
try {
  new URL(config.API_URL);
  console.log('URL válida');
} catch (error) {
  console.error('URL inválida:', error);
}

export default config;
