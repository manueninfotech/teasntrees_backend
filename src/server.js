// Load environment variables FIRST - dotenv/config automatically loads .env
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminRoutes from './routes/admin/index.js';

import { notFound, errorHandler } from './middlewares/errorHandler.js';

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for test-api.html)
app.use(express.static(join(__dirname, '..')));

//MongoDB connection
import connectDB from './config/db.js';
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// IMPORTANT: Register more specific routes BEFORE general routes
// Admin authentication must come before /api/admin to avoid route conflicts
app.use('/api/admin/auth', adminAuthRoutes);

// Admin CRUD routes (this catches all /api/admin/* except /api/admin/auth/*)
app.use('/api/admin', adminRoutes);

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

// start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;