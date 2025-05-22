import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Configura CORS para frontend (modifica según tu frontend)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

// Middleware para parsear JSON en peticiones
app.use(express.json());

// Rutas autenticación bajo /auth
app.use('/auth', authRoutes);

// Ruta raíz simple para prueba de API
app.get('/', (_req, res) => {
  res.send('API de Lujos backend funcionando');
});

// Middleware global manejo de errores (último middleware)
app.use(errorHandler);

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
