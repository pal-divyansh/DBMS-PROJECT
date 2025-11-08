require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth');
const messRoutes = require('./routes/mess');
const transportRoutes = require('./routes/transport');
const waterRoutes = require('./routes/water');
const internetRoutes = require('./routes/internet');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/cleaning', require('./routes/cleaning'));

// Mount internet routes under /api/network
app.use('/api/network', internetRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HostelSync API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Test database connection and start server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📄 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client disconnected');
  process.exit(0);
});



// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYyNjA3NDQ2LCJleHAiOjE3NjMyMTIyNDZ9.Cgk_N_kobG9gAmsyzfJ19uY7hBQHFocEF2dQKTeYPqU