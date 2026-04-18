import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tnt-lh.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tnt-lh",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tnt-lh.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

/**
 * Request FCM Token for notifications
 */
export const requestFCMToken = async () => {
    try {
        if (!('serviceWorker' in navigator)) {
            console.warn('FCM: Service Workers not supported');
            return null;
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE') {
            console.warn('FCM: VAPID Key missing in .env. Skipping token request.');
            return null;
        }

        // 1. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('FCM: Notification permission denied');
            return null;
        }

        // 2. Register Service Worker with .env config as query parameters
        const config = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        const queryParams = new URLSearchParams(config).toString();
        const swUrl = `/firebase-messaging-sw.js?${queryParams}`;

        // Register and wait for it to be ready
        await navigator.serviceWorker.register(swUrl);
        const registration = await navigator.serviceWorker.ready;
        console.log('FCM: Service Worker is ready and active');

        // 3. Get Token
        // Passing the registration explicitly is safer when using custom SW URLs
        const token = await getToken(messaging, {
            serviceWorkerRegistration: registration,
            vapidKey: vapidKey.trim()
        });

        if (token) {
            console.log('FCM: Successfully registered with token:', token);
            return token;
        } else {
            console.warn('FCM: No registration token available.');
            return null;
        }
    } catch (error) {
        console.error('FCM: An error occurred while retrieving token:', error);
        return null;
    }
};

// Handle foreground messages
export const onForegroundMessage = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log('FCM: Foreground message received:', payload);
        callback(payload);
    });
};

export default app;
