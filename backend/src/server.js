import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Routes and controllers
import customerAuthRoutes from './routes/customer/authRoutes.js';
import customerProfileRoutes from './routes/customer/profileRoutes.js';
import customerProductRoutes from './routes/customer/productRoutes.js';
import customerCategoryRoutes from './routes/customer/categoryRoutes.js';
import customerOrderRoutes from './routes/customer/orderRoutes.js';
import customerCartRoutes from './routes/customer/cartRoutes.js';
import customerDeliveryRoutes from './routes/customer/deliveryRoutes.js';
import customerReviewRoutes from './routes/customer/reviewRoutes.js';
import customerAddressRoutes from './routes/customer/addressRoutes.js';
import customerWishlistRoutes from './routes/customer/wishlistRoutes.js';
import customerSettingsRoutes from './routes/customer/settingsRoutes.js';
import customerUploadRoutes from './routes/customer/uploadRoutes.js';
import customerContactRoutes from './routes/customer/contactRoutes.js';
import customerPaymentRoutes from './routes/customer/paymentRoutes.js';
import customerCouponRoutes from './routes/customer/couponRoutes.js';
import customerStatusRoutes from './routes/customer/statusRoutes.js';

import adminAuthRoutes from './routes/admin/authRoutes.js';
import adminProfileRoutes from './routes/admin/profileRoutes.js';
import adminContactRoutes from './routes/admin/contactRoutes.js';
import adminRoutes from './routes/admin/index.js';

import payoutRoutes from './routes/admin/payoutRoutes.js';
import managerRoutes from './routes/manager/index.js';
import riderRoutes from './routes/rider/index.js';

import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { socketAuth } from './middlewares/socketAuth.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';
import { SocketService } from './services/socketService.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import logger from './config/logger.js';
import { SOCKET_EVENTS } from './sockets/socketEvents.js';
import { initNudgeWorker } from './workers/nudgeWorker.js';

const app = express();
app.set('trust proxy', 1); // Trust first proxy for express-rate-limit


// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

// Helper function to check if origin is allowed (with www/non-www flexibility)
const checkOrigin = (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === '*' || allowed === origin) return true;

        // Normalize both to compare without www. prefix
        const originBase = origin.replace(/^https?:\/\/(www\.)?/, '');
        const allowedBase = allowed.replace(/^https?:\/\/(www\.)?/, '');
        return originBase === allowedBase;
    });

    if (isAllowed) {
        callback(null, true);
    } else {
        logger.error(`CORS blocked for origin: ${origin}`);
        const error = new Error('Not allowed by CORS');
        error.statusCode = 403;
        callback(error);
    }
};

app.use(cors({
    origin: checkOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-type'],
    optionsSuccessStatus: 200
}));

// Security and parsers
app.use(helmet({
    // allow other origins to load static assets (required when frontend is on
    // a different host/port during development)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"],
            "script-src-attr": ["'unsafe-inline'"],
            // allow images from our own api server and the frontend origin(s)
            "img-src": [
                "'self'",
                "data:",
                // when frontend runs on another port it still needs to fetch
                // product placeholders from the backend.
                'http://localhost:5000',
                ...(allowedOrigins.includes('*') ? [] : allowedOrigins)
            ]
        }
    }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Loading
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// Rate Limiting
app.use('/api/', apiLimiter);

// Http + Socket server
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: checkOrigin, // Use the same flexible check as the main API
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }
});

io.use(socketAuth);
setupSocketHandlers(io);

import { riderAssignmentService } from './services/riderAssignmentService.js';
riderAssignmentService.setIo(io);

const socketService = new SocketService(io);
app.set('io', io);
app.set('socketService', socketService);

// Global real time invalidation
app.use((req, res, next) => {
    const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
    if (!writeMethods.has(req.method)) return next();
    if (req.originalUrl.startsWith('/socket.io')) return next();

    res.on('finish', () => {
        if (res.statusCode < 400) {
            // Exclude noisy/high-frequency endpoints that don't need a global system refresh
            const noisyEndpoints = [
                '/deliveries/location',
                '/auth/profile', // Usually a GET, but safety first
                '/health'
            ];

            const isNoisy = noisyEndpoints.some(endpoint => req.originalUrl.includes(endpoint));
            if (isNoisy) return;

            io.emit(SOCKET_EVENTS.SYSTEM_DATA_UPDATED, {
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode
            });
        }
    });

    next();
});

// Static files - serve public storage
const publicStoragePath = process.env.STORAGE_PUBLIC_PATH || join(__dirname, '../../uploads/public');
app.use('/public', express.static(publicStoragePath));
app.use('/uploads', express.static(join(__dirname, '../../uploads'))); // Keep old uploads working just in case

// Database connection
import './models/Counter.js';
import connectDB from './config/db.js';
connectDB();

import { brandMiddleware } from './middlewares/brandMiddleware.js';

/* =======================
   ROUTES
