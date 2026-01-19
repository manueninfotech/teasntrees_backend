const { exec } = require('child_process');
const path = require('path');

const scripts = [
    'test-auth.js',
    'test-categories.js',
    'test-products.js',
    'test-profile.js',
    'test-address-book.js',
    'test-cart.js',
    'test-wishlist.js',
    'test-order-features.js',
    'test-delivery.js',
    'test-notifications.js',
    'test-notifications.js',
    'test-reviews.js',
    'test-socket-customer.js'
];

async function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n>>> JAVA SCRIPT: ${scriptName} <<<`);
        const scriptPath = path.join(__dirname, scriptName);

        const process = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`!!! FAILED: ${scriptName} !!!`);
                console.error(stderr);
                // reject(error); // Don't stop, just log
                resolve(false);
            } else {
                console.log(stdout);
                console.log(`>>> PASSED: ${scriptName}`);
                resolve(true);
            }
        });
    });
}

async function runAll() {
    console.log('Starting Full Customer Feature Test Suite...');
    for (const script of scripts) {
        await runScript(script);
    }
    console.log('\nAll Tests Completed.');
}

runAll();
