import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

import yakoaRoutes from './routes/yakoa';
import { yakoaIntegration } from './lib/yakoa-integration';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Different port from Yakoa backend

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/yakoa', yakoaRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'seeker-backend',
    timestamp: new Date().toISOString()
  });
});

// Yakoa backend health check endpoint
app.get('/health/yakoa', async (_req, res) => {
  try {
    const isHealthy = await yakoaIntegration.healthCheck();
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'yakoa-backend',
      timestamp: new Date().toISOString(),
      yakoaBackendUrl: process.env.YAKOA_BACKEND_URL || 'http://localhost:5000'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      service: 'yakoa-backend',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Default route
app.get('/', (_req, res) => {
  res.json({
    message: '✅ Seeker Backend with Yakoa Integration is running!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      yakoaHealth: '/health/yakoa',
      yakoa: {
        register: '/api/yakoa/register/:ipAssetId',
        status: '/api/yakoa/status/:ipAssetId',
        registerMultiple: '/api/yakoa/register-multiple',
        registerAll: '/api/yakoa/register-all',
        reports: '/api/yakoa/reports',
        assets: '/api/yakoa/assets'
      }
    }
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Seeker Backend server running at http://localhost:${PORT}`);
  console.log(`🔗 Yakoa Backend URL: ${process.env.YAKOA_BACKEND_URL || 'http://localhost:5000'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Yakoa health check: http://localhost:${PORT}/health/yakoa`);
}); 