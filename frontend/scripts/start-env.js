require('dotenv').config();

// Verificar y mostrar variables de entorno
console.log('Variables de entorno:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Todas las variables:', process.env);

// Iniciar Next.js
require('child_process').execSync('next dev', { stdio: 'inherit' });
