import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load the .env file from the root of the backend folder
// and ensure it overrides any existing environment variables
dotenv.config({
    path: path.resolve(__dirname, '../.env'),
    override: true
});

console.log('Environment variables loaded from .env (with override)');
