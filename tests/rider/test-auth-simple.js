import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/rider/auth';

async function runTests() {
    console.log('Testing Rider Auth...');

    const mobile = '9988776655';

    // 1. Send OTP
    console.log('\n1. Sending OTP...');
    const sendOtpRes = await fetch(`${BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
    });
    const sendOtpData = await sendOtpRes.json();
    console.log('Send OTP Result:', sendOtpData);

    // If rider not found (expected if DB empty), we know endpoint works at least.

    if (sendOtpData.message === 'Rider not found. Please register first.') {
        console.log('Correctly identified non-existent rider.');
    }
}

runTests();
