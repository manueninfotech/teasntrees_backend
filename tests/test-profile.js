const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testProfile() {
    try {
        console.log('--- Starting Profile Test ---');

        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Request failed');
            return data;
        };

        // 1. Login
        console.log('1. Logging in...');
        let otp = '123456';
        try {
            const otpRes = await request(`${API_URL}/auth/send-otp`, 'POST', { mobile: MOBILE });
            if (otpRes.data && otpRes.data.otp) otp = otpRes.data.otp;
        } catch (e) { }
        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', { mobile: MOBILE, otp });
        const token = verifyRes.data.token;
        console.log('   Logged in.');

        // 2. Get Profile
        console.log('2. Fetching Profile...');
        const profileRes = await request(`${API_URL}/profile`, 'GET', null, token);
        const originalName = profileRes.data.name;
        console.log(`   Current Name: ${originalName}`);

        // 3. Update Profile
        const newName = originalName === 'Test User A' ? 'Test User B' : 'Test User A';
        console.log(`3. Updating Name to: ${newName}...`);

        const updateRes = await request(`${API_URL}/profile`, 'PUT', {
            name: newName
        }, token);

        if (updateRes.data.name !== newName) throw new Error('Name update mismatch');
        console.log('   Update Verified.');

        // 4. Verify Persistence
        console.log('4. Verifying Persistence...');
        const checkRes = await request(`${API_URL}/profile`, 'GET', null, token);
        if (checkRes.data.name !== newName) throw new Error('Persistence check failed');
        console.log('   Persistence Verified.');

        console.log('--- Profile Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testProfile();
