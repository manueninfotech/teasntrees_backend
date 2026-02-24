import 'dotenv/config';
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

import adminAuthRoutes from './routes/admin/authRoutes.js';
import adminProfileRoutes from './routes/admin/profileRoutes.js';
import adminContactRoutes from './routes/admin/contactRoutes.js';
import adminRoutes from './routes/admin/index.js';

import riderAuthRoutes from './routes/rider/authRoutes.js';
import riderDeliveryRoutes from './routes/rider/deliveryRoutes.js';

import payoutRoutes from './routes/admin/payoutRoutes.js';
import managerRoutes from './routes/manager/index.js';

import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { socketAuth } from './middlewares/socketAuth.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';
import { SocketService } from './services/socketService.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import logger from './config/logger.js';
import { SOCKET_EVENTS } from './sockets/socketEvents.js';

const app = express();


// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        logger.warn(`CORS blocked for origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

app.options(/.*/, cors());

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
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }
});

io.use(socketAuth);
setupSocketHandlers(io);

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
            io.emit(SOCKET_EVENTS.SYSTEM_DATA_UPDATED, {
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode
            });
        }
    });

    next();
});

// Static files
app.use(express.static(join(__dirname, '..')));

// Database connection
import './models/Counter.js';
import connectDB from './config/db.js';
connectDB();

import { brandMiddleware } from './middlewares/brandMiddleware.js';

/* =======================
   ROUTES
======================= */
// Customer Sub-Router to group routes under /api/:brand
const customerApiRouter = express.Router({ mergeParams: true });
customerApiRouter.use(brandMiddleware);

// Mount customer routes to the sub-router
customerApiRouter.use('/auth', customerAuthRoutes);
customerApiRouter.use('/profile', customerProfileRoutes);
customerApiRouter.use('/products', customerProductRoutes);
customerApiRouter.use('/categories', customerCategoryRoutes);
customerApiRouter.use('/cart', customerCartRoutes);
customerApiRouter.use('/orders', customerOrderRoutes);
customerApiRouter.use('/deliveries', customerDeliveryRoutes);
customerApiRouter.use('/reviews', customerReviewRoutes);
customerApiRouter.use('/address', customerAddressRoutes);
customerApiRouter.use('/wishlist', customerWishlistRoutes);
customerApiRouter.use('/settings', customerSettingsRoutes);
customerApiRouter.use('/upload', customerUploadRoutes);
customerApiRouter.use('/contact', customerContactRoutes);
customerApiRouter.use('/payments', customerPaymentRoutes);

// Finally mount the customer sub-router to the main app
app.use('/api/:brand/customer', customerApiRouter);

// Admin
app.use('/api/:brand/admin/auth', brandMiddleware, adminAuthRoutes);
app.use('/api/:brand/admin/profile', brandMiddleware, adminProfileRoutes);
app.use('/api/:brand/v1/admin/contact', brandMiddleware, adminContactRoutes);
app.use('/api/:brand/admin', brandMiddleware, adminRoutes);
app.use('/api/:brand/admin/payouts', brandMiddleware, payoutRoutes);

// Rider
app.use('/api/rider/auth', riderAuthRoutes);
app.use('/api/rider/deliveries', riderDeliveryRoutes);

// Manager
app.use('/api/:brand/manager', brandMiddleware, managerRoutes);

// Basic routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Teas N Trees Backend API',
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

import os from 'os';

function getLanIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Start server
// const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 5000;
const LAN_IP = getLanIP();


httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${LAN_IP}:${PORT}`);
    console.log(`Socket.io enabled`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
