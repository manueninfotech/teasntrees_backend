// PM2 process definition for the Teas n Trees / Little H backend.
//
// Usage on the production VM (from the backend/ directory):
//   pm2 start ecosystem.config.cjs
//   pm2 save                       # persist across reboots
//
// Secrets (MONGO_URI, JWT_SECRET, RAZORPAY_*, FIREBASE_SERVICE_ACCOUNT, etc.)
// stay in the .env file next to this config — pm2 loads them via dotenv in
// server.js. Only non-secret operational flags live here.
//
// Log rotation is handled by the pm2-logrotate module (install once):
//   pm2 install pm2-logrotate
//   pm2 set pm2-logrotate:max_size 20M
//   pm2 set pm2-logrotate:retain 14
//   pm2 set pm2-logrotate:compress true

module.exports = {
    apps: [
        {
            name: 'teasntrees-backend',
            script: 'src/server.js',
            cwd: __dirname,

            // Single fork instance. The app holds Socket.io state and an
            // in-process escalation monitor, so clustering would need a
            // socket.io Redis adapter and a single-owner guard on the cron
            // jobs first — keep fork mode until that work is done.
            exec_mode: 'fork',
            instances: 1,

            autorestart: true,
            max_restarts: 10,
            min_uptime: '20s',
            // Restart if memory balloons (leak guard on a 2-vCPU VM).
            max_memory_restart: '600M',

            env: {
                NODE_ENV: 'production',
                // Background jobs (abandoned-cart nudge, retention nudge,
                // rider escalation monitor) must run on exactly ONE instance.
                // This is that instance, so they are enabled here. Any dev or
                // secondary process must set ENABLE_BACKGROUND_JOBS=false.
                ENABLE_BACKGROUND_JOBS: 'true',
            },

            // Timestamped, merged logs. pm2-logrotate compresses/prunes these.
            time: true,
            merge_logs: true,
            out_file: 'C:\\Users\\tntadmin\\.pm2\\logs\\teasntrees-backend-out.log',
            error_file: 'C:\\Users\\tntadmin\\.pm2\\logs\\teasntrees-backend-error.log',
        },
    ],
};
