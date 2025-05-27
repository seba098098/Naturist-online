import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import { errorHandler, ERROR_TYPES } from './middleware/errorHandler';
import { publicRoutes } from './routes/auth';

dotenv.config();

// Inicializar Prisma Client
export const prisma = new PrismaClient();

// Configuración de la aplicación
const app: Application = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Crear servidor HTTP
const httpServer = createServer(app);

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

// Middleware para exponer el objeto io en las rutas
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

// Configuración de seguridad con Helmet
app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        type: 'RATE_LIMIT',
        message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde.'
      }
    });
  }
});

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Middleware para parsear JSON y datos de formularios
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Middleware para parsear cookies
app.use(cookieParser());

// Middleware para registrar peticiones (solo en desarrollo)
if (NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Ruta de verificación de salud
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Ruta raíz
app.get('/', (_req, res) => {
  res.json({
    name: 'API de Lujos',
    version: '1.0.0',
    environment: NODE_ENV,
    documentation: '/api-docs' // URL para documentación si usas Swagger/OpenAPI
  });
});

// Rutas de la API (con prefijo /api)
app.use('/api', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}, authRoutes);

// Middleware para manejar rutas no encontradas (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NOT_FOUND',
      message: 'Ruta no encontrada'
    }
  });
});

// Middleware global de manejo de errores (debe ir después de las rutas)
app.use(errorHandler);

// Función para cerrar correctamente las conexiones al apagar el servidor
const gracefulShutdown = async () => {
  console.log('Cerrando conexiones...');
  
  // Cerrar servidor HTTP
  httpServer.close(() => {
    console.log('Servidor HTTP cerrado');
    
    // Cerrar conexión de Prisma
    prisma.$disconnect()
      .then(() => console.log('Conexión a la base de datos cerrada'))
      .catch(console.error)
      .finally(() => process.exit(0));
  });
};

// Manejadores para señales de terminación
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Servidor en ejecución en modo ${NODE_ENV}`);
  console.log(`🌐 URL del frontend: ${FRONTEND_URL}`);
  console.log(`🔌 Socket.IO habilitado en /socket.io`);
  console.log(`📡 Escuchando en http://localhost:${PORT}\n`);
});

export default app;
