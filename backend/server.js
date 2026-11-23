import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import metaRoutes from './routes/metaRoutes.js';

// Middlewares
import { apiAuditLogger } from './middlewares/loggerMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow Vite dev server and external clients
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// Automated API mutation audit logging
app.use(apiAuditLogger);

// Health check endpoint
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'Military Asset Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
app.get('/', healthHandler);

// Mount modular API routes (supports both /api/* and root /*)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/assets', '/assets'], assetRoutes);
app.use(['/api/purchases', '/purchases'], purchaseRoutes);
app.use(['/api/transfers', '/transfers'], transferRoutes);
app.use(['/api/assignments', '/assignments'], assignmentRoutes);
app.use(['/api/audit-logs', '/audit-logs'], auditRoutes);
app.use(['/api/meta', '/meta'], metaRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Express HTTP Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  MILITARY ASSET MANAGEMENT SYSTEM - API SERVER`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

export default app;
