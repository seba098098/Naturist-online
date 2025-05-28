console.log('Starting Next.js Server...');
console.log('Environment Variables:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

require('next/dist/server/next')
  .default({
    dev: true,
    dir: '.',
  })
  .then((next) => {
    next.prepare().then(() => {
      console.log('Server is ready');
    });
  });
