import 'dotenv/config';
import connectDB from '../config/db.js';
import { checkAbandonedCarts, checkUserRetention } from './nudgeWorker.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

/**
 * Manual Test Script for Nudge Workers
 * This script connects to the database, runs the nudge jobs, and then exits.
 */
const runManualTest = async () => {
    try {
        console.log('\n--- Nudge Worker Manual Test ---\n');
        
        // 1. Connect to Database
        await connectDB();
        
        // 2. Run Abandoned Cart Check
        console.log('Starting Abandoned Cart Check...');
        await checkAbandonedCarts();
        
        // 3. Run User Retention Check
        console.log('\nStarting User Retention Check...');
        await checkUserRetention();
        
        console.log('\nTest completed successfully.');
        
        // 4. Force exit after a small delay to allow logging to finish
        setTimeout(() => {
            mongoose.connection.close();
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        logger.error('Manual Test Failed:', error);
        process.exit(1);
    }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

runManualTest();
