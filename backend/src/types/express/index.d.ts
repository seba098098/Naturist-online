import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (_req, res) => {
  res.send('API de Lujos backend funcionando');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
