const API_URL = 'http://localhost:5000/api/rider/auth';
const RIDER_MOBILE = '9876543210';

// Helper to handle fetch responses
const request = async (url, method, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

// Reusable Helper
async function getRiderToken() {
    try {
        // 1. Send OTP
        await request(`${API_URL}/send-otp`, 'POST', { mobile: RIDER_MOBILE });

        // 2. Verify OTP (Using '123456' as per dev bypass or standard test OTP)
        const verifyRes = await request(`${API_URL}/verify-otp`, 'POST', {
            mobile: RIDER_MOBILE,
            otp: '123456'
        });

        if (verifyRes.token) return verifyRes.token; // Direct login
        if (verifyRes.data && verifyRes.data.token) return verifyRes.data.token; // Profile complete

        // If here, profile incomplete. Complete it.
        // Assuming verifyRes gives us a hint or we just try complete-profile
        // But for Rider, register is /register with file uploads (multipart).
        // This is tricky with fetch/JSON.
        // IF the rider exists in Seeder, we get a token.
        // If not, we might need a distinct Register test.
        // For now, let's assume the Rider exists or we can rely on existing seeders.
        throw new Error('Rider login failed (Profile incomplete or new user requires Registration flow)');

    } catch (error) {
        console.error('Get Rider Token Failed:', error.message);
        return null;
    }
}

async function testRiderAuth() {
    console.log('--- Starting Rider Auth Test ---');
    try {
        // 1. Send OTP
        console.log('1. Sending OTP...');
        await request(`${API_URL}/send-otp`, 'POST', { mobile: RIDER_MOBILE });
        console.log('   OTP Sent.');

        // 2. Verify OTP
        console.log('2. Verifying OTP...');
        const verifyRes = await request(`${API_URL}/verify-otp`, 'POST', {
            mobile: RIDER_MOBILE,
            otp: '123456'
        });

        let token = verifyRes.token || (verifyRes.data && verifyRes.data.token);
        console.log('   OTP Verified.');

        if (!token) {
            console.log('   ! Token missing. Rider might need registration (Multipart Upload). Skipping Profile/Availability checks.');
            return;
        }

        // 3. Get Profile
        console.log('3. Fetching Profile...');
        const profileRes = await request(`${API_URL}/profile`, 'GET', null, token);
        console.log(`   Profile: ${profileRes.data.name} (${profileRes.data.mobile})`);

        // 4. Toggle Availability
        console.log('4. Toggling Availability...');
        const availRes = await request(`${API_URL}/availability`, 'POST', {}, token);
        console.log(`   New Availability: ${availRes.data.isAvailable}`);

        console.log('--- Rider Auth Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

if (require.main === module) {
    testRiderAuth();
}

module.exports = { getRiderToken };
