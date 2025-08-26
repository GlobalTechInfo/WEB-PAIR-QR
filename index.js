/**
 * =============================================================
 * SEPTORCH WHATSAPP BOT - PROFESSIONAL SERVER CONFIGURATION
 * =============================================================
 * 
 * @description Enterprise-grade WhatsApp automation platform
 * @author Septorch Team
 * @version 2.1.0
 * @license MIT
 * @contact https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04
 * 
 * Production-ready server with:
 * - Security hardening
 * - Performance monitoring
 * - Professional logging
 * - Graceful shutdown
 * - Health checks
 * - Rate limiting
 * - Comprehensive error handling
 * 
 * "Automation & Growth Tools for creators, brands, and entrepreneurs"
 */

// ======================
// CORE MODULES
// ======================
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');
const cluster = require('cluster');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

// ======================
// CONFIGURATION
// ======================
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';
const MAX_REQUESTS_PER_MINUTE = 100;
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds
const __path = process.cwd();

// ======================
// LOGGER CONFIGURATION
// ======================
const logFormat = printf(({ level, message, timestamp, service }) => {
  return `${timestamp} [${service}] ${level}: ${message}`;
});

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    logFormat
  ),
  defaultMeta: { service: 'septorch-bot' },
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: path.join(__path, 'logs', 'error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: path.join(__path, 'logs', 'combined.log') 
    })
  ]
});

// Create logs directory if it doesn't exist
if (!fs.existsSync(path.join(__path, 'logs'))) {
  fs.mkdirSync(path.join(__path, 'logs'));
}

// ======================
// SECURITY MIDDLEWARE
// ======================
const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net', 'static.whatsapp.net'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      connectSrc: ["'self'", 'api.whatsapp.com', 'whatsapp.com'],
      frameSrc: ["'self'", 'whatsapp.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true
};

// ======================
// RATE LIMITING
// ======================
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: MAX_REQUESTS_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after a minute',
    code: 429
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// ======================
// HEALTH CHECK ENDPOINT
// ======================
const serverStartTime = Date.now();
let isShuttingDown = false;

// ======================
// EXPRESS APP SETUP
// ======================
const app = express();

// Server identification header
app.set('x-powered-by', 'Septorch WhatsApp Automation Platform');

// Basic security headers
app.use(helmet(securityHeaders));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  maxAge: 86400
}));

// Request ID for tracing
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  logger.info(`[${req.method}] ${req.path} - ${req.id}`);
  next();
});

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parser with security limits
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb',
  parameterLimit: 20 
}));

// Rate limiting for API routes
app.use('/qr', apiLimiter);
app.use('/code', apiLimiter);

// ======================
// HEALTH CHECK ENDPOINTS
// ======================
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'ok',
    version: '2.1.0',
    uptime: {
      seconds: uptime,
      formatted: `${Math.floor(uptime / 86400)}d ${Math.floor(uptime / 3600) % 24}h ${Math.floor(uptime / 60) % 60}m`
    },
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    },
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version
  });
});

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Septorch WhatsApp Bot is running',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    channelFollowers: '1.2K+',
    description: 'Automation & Growth Tools for creators, brands, and entrepreneurs'
  });
});

// ======================
// STATIC FILES & ROUTES
// ======================
// Serve static files with cache control
app.use(express.static(path.join(__path, 'public'), {
  maxAge: isProduction ? '30d' : '1h',
  etag: true,
  lastModified: true
}));

// Routes
app.use('/qr', require('./qr'));
app.use('/code', require('./pair'));

// HTML pages with cache control
app.get('/pair', (req, res) => {
  res.sendFile(path.join(__path, 'pair.html'), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__path, 'main.html'), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// ======================
// ERROR HANDLING
// ======================
// 404 Handler
app.use((req, res, next) => {
  logger.warn(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`500 - Server Error: ${req.id} - ${err.message}`);
  logger.error(err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred' : err.message,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ======================
// SERVER STARTUP
// ======================
let server;

const startServer = () => {
  if (process.env.USE_HTTPS && fs.existsSync(process.env.SSL_CERT) && fs.existsSync(process.env.SSL_KEY)) {
    const options = {
      cert: fs.readFileSync(process.env.SSL_CERT),
      key: fs.readFileSync(process.env.SSL_KEY)
    };
    
    server = https.createServer(options, app).listen(PORT, HOST, () => {
      logger.info(`🛡️  HTTPS Server running on https://${HOST}:${PORT}`);
      logger.info(`📱 Septorch WhatsApp Bot v2.1.0 is active`);
      logger.info(`🔗 Channel: https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04`);
      logger.info(`📊 1.2K+ followers • Automation & Growth Tools`);
      logger.info(`💡 "Chat automation, contact growth, and smart business tools for creators, brands, and entrepreneurs."`);
    });
  } else {
    server = http.createServer(app).listen(PORT, HOST, () => {
      logger.info(`🌐 HTTP Server running on http://${HOST}:${PORT}`);
      logger.info(`📱 Septorch WhatsApp Bot v2.1.0 is active`);
      logger.info(`🔗 Channel: https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04`);
      logger.info(`📊 1.2K+ followers • Automation & Growth Tools`);
      logger.info(`💡 "Chat automation, contact growth, and smart business tools for creators, brands, and entrepreneurs."`);
    });
  }
  
  // Handle graceful shutdown
  const gracefulShutdown = () => {
    if (isShuttingDown) return;
    
    isShuttingDown = true;
    logger.info('.SIGTERM received. Starting graceful shutdown...');
    
    // Stop accepting new requests
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      logger.error(`Could not close server within ${SHUTDOWN_TIMEOUT}ms. Forcing shutdown.`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT).unref();
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown();
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};

// ======================
// CLUSTERING FOR PRODUCTION
// ======================
if (isProduction && cluster.isMaster && os.cpus().length > 1) {
  const numCPUs = os.cpus().length;
  logger.info(`🚀 Master cluster setting up ${numCPUs} workers...`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Monitor workers
  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker ${worker.process.pid} died. Code: ${code}. Signal: ${signal}`);
    logger.info('Starting a new worker');
    cluster.fork();
  });
} else {
  startServer();
}

module.exports = app;
