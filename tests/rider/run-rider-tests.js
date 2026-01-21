const { spawn } = require('child_process');
const path = require('path');

const tests = [
    'test-rider-auth.js',
    'test-rider-delivery.js'
];

async function runTests() {
    console.log('🚀 Running Rider Test Suite...\n');

    for (const testFile of tests) {
        await new Promise((resolve, reject) => {
            const p = spawn('node', [testFile], {
                cwd: __dirname,
                stdio: 'inherit',
                shell: true
            });

            p.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Test ${testFile} failed with code ${code}`));
            });
        });
        console.log('\n'); // Spacing
    }

    console.log('✅ All Rider Tests Completed.');
}

runTests().catch(err => {
    console.error(err.message);
    process.exit(1);
});
