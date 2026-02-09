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

// Routes
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

// Initialize express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const allowedOrigins = (process.env.FRONTEND_URL || '*').split(',').map(url => url.trim());

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Apply Socket.io authentication middleware
io.use(socketAuth);

// Setup Socket.io event handlers
setupSocketHandlers(io);

// Create Socket Service and make it accessible to routes
const socketService = new SocketService(io);
app.set('io', io);
app.set('socketService', socketService);

// Global real-time invalidation for any successful write
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

// CORS configuration (Moved up for preflight handling)
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"], // Allow inline scripts for test pages
            "script-src-attr": ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
        },
    },
})); // Set security HTTP headers
app.use(express.json({ limit: '10mb' })); // Body limit to prevent payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    stream: logger.stream
}));


// Rate limiting for API routes
app.use('/api/', apiLimiter);

// Serve static files (for test-api.html)
app.use(express.static(join(__dirname, '..')));

//MongoDB connection
import './models/Counter.js';
import connectDB from './config/db.js';
connectDB();

// Customer Routes
app.use('/api/customer/auth', customerAuthRoutes);         // Customer authentication
app.use('/api/customer/profile', customerProfileRoutes);   // Customer profile
app.use('/api/customer/products', customerProductRoutes);  // Product browsing
app.use('/api/customer/categories', customerCategoryRoutes); // Category browsing
app.use('/api/customer/cart', customerCartRoutes);         // Shopping cart
app.use('/api/customer/orders', customerOrderRoutes);      // Order management
app.use('/api/customer/deliveries', customerDeliveryRoutes); // Delivery tracking
app.use('/api/customer/reviews', customerReviewRoutes);    // Product reviews
app.use('/api/customer/address', customerAddressRoutes);   // Address Book
app.use('/api/customer/wishlist', customerWishlistRoutes); // Wishlist
app.use('/api/customer/settings', customerSettingsRoutes); // App Settings (Delivery Charge etc.)
app.use('/api/customer/upload', customerUploadRoutes);     // Image Upload
app.use('/api/v1/contact', customerContactRoutes);         // Contact Form (Public/v1)


// Admin Routes  
app.use('/api/admin/auth', adminAuthRoutes);           // Admin authentication
app.use('/api/admin/profile', adminProfileRoutes);     // Admin profile
app.use('/api/v1/admin/contact', adminContactRoutes);  // Contact Management (v1)
app.use('/api/admin', adminRoutes);                    // Admin CRUD operations (includes Payouts)

// Rider Routes
app.use('/api/rider/auth', riderAuthRoutes);           // Rider authenticaton
app.use('/api/rider/deliveries', riderDeliveryRoutes);

// Manager Routes
app.use('/api/manager', managerRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to the Teas N Trees Backend API",
        version: "1.0.0",
        endpoints: {
            auth: 'api/auth',
            users: 'api/users'
        }
    });
});

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});


// 404 Handler 
app.use(notFound);

// Global Error Handler 
app.use(errorHandler);

// start the server with Socket.io
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Force Restart Check: ${new Date().toISOString()}`);
    console.log(`Socket.io enabled for real-time features`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
