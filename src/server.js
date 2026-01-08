const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const { notFound, errorHandler } = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for test-api.html)
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));


//MongoDB connection
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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

module.exports = app;