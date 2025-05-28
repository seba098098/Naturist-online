const { execSync } = require('child_process');

// Verificar y mostrar variables de entorno
console.log('Variables de entorno:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Todas las variables:', process.env);

// Iniciar Next.js
execSync('next dev', { stdio: 'inherit' });
