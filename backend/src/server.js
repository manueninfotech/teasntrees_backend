// Load environment variables FIRST - dotenv/config automatically loads .env
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname in ES modules
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
import adminAuthRoutes from './routes/admin/authRoutes.js';
import adminProfileRoutes from './routes/admin/profileRoutes.js';
import adminRoutes from './routes/admin/index.js';

import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { socketAuth } from './middlewares/socketAuth.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';
import { SocketService } from './services/socketService.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import logger from './config/logger.js';

// Initialize express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
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
// Temporarily disabled due to compatibility issue with Express
// app.use(mongoSanitize({ replaceWith: '_' })); // Prevent NoSQL injection
app.use(express.json({ limit: '10mb' })); // Body limit to prevent payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    stream: logger.stream
}));

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting for API routes
app.use('/api/', apiLimiter);

// Serve static files (for test-api.html)
app.use(express.static(join(__dirname, '..')));

//MongoDB connection
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


// Admin Routes  
app.use('/api/admin/auth', adminAuthRoutes);           // Admin authentication
app.use('/api/admin/profile', adminProfileRoutes);     // Admin profile
app.use('/api/admin', adminRoutes);                    // Admin CRUD operations

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