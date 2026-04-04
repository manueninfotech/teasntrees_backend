import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!admin.apps.length) {
    try {
        let credential;

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Load from base64 string or JSON string in ENV
            const serviceAccount = JSON.parse(
                process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')
                    ? process.env.FIREBASE_SERVICE_ACCOUNT
                    : Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
            );
            credential = admin.credential.cert(serviceAccount);
        } else {
            // Fallback to local file
            const serviceAccountPath = path.join(__dirname, './serviceAccountKey.json');
            credential = admin.credential.cert(serviceAccountPath);
        }

        admin.initializeApp({ credential });
        console.log('Firebase Admin initialized successfully');
    } catch (err) {
        console.error('Firebase Admin initialization failed:', err.message);
        console.warn('Ensure FIREBASE_SERVICE_ACCOUNT env var is set or src/config/serviceAccountKey.json exists.');
    }
}

export default admin;
