const { spawn } = require('child_process');
const path = require('path');

const scripts = [
    'test-auth.js',
    'test-dashboard.js',
    'test-products.js',
    'test-orders.js',
    'test-users.js',
    'test-activity.js',
    'test-analytics.js',
    'test-delivery.js',
    'test-profile.js',
    'test-reviews.js',
    'test-settings.js',
    'test-upload.js',
    'test-socket-admin.js'
];

async function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n>>> EXEC: ${scriptName} <<<`);
        const scriptPath = path.join(__dirname, scriptName);

        const proc = spawn('node', [scriptPath], {
            stdio: 'inherit',
            shell: true
        });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`>>> PASSED: ${scriptName}`);
                resolve();
            } else {
                console.error(`>>> FAILED: ${scriptName} (Exit code: ${code})`);
                reject(new Error(`Script ${scriptName} failed`));
            }
        });
    });
}

async function runAll() {
    console.log('Starting Admin Test Suite...');
    for (const script of scripts) {
        try {
            await runScript(script);
        } catch (error) {
            console.error('Suite stopped due to failure.');
            process.exit(1);
        }
    }
    console.log('\nAll Admin Tests Completed Successfully.');
}

runAll();
