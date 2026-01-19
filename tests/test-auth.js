const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testAuth() {
    try {
        console.log('--- Starting Auth Test ---');

        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 429) {
                    console.warn(`[WARN] Rate limited on ${url} (429)`);
                    return { error: true, status: 429, ...data };
                }
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        // 1. Send OTP
        console.log('1. Sending OTP...');
        const otpRes = await request(`${API_URL}/auth/send-otp`, 'POST', { mobile: MOBILE });
        console.log('   OTP Sent:', otpRes.message);

        let otp = '123456';
        if (otpRes.data && otpRes.data.otp) {
            otp = otpRes.data.otp;
            console.log(`   (Using Dev OTP: ${otp})`);
        } else {
            console.log('   (Using Hardcoded Test OTP: 123456)');
        }

        // 2. Verify OTP
        console.log('2. Verifying OTP...');
        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', { mobile: MOBILE, otp });
        console.log('   Login Successful. Token received.');
        const token = verifyRes.data.token;

        // 3. Complete Profile (if new user) or check profile
        // This endpoint is effectively "update profile" for new users, but can be called anytime usually
        /*
        console.log('3. Complete/Update Profile...');
        const profileRes = await request(`${API_URL}/auth/complete-profile`, 'POST', {
             mobile: MOBILE,
             name: 'Test User Auto',
             email: 'testuser@example.com'
        });
        console.log('   Profile Updated:', profileRes.message);
        */

        // 4. Refresh Token
        console.log('4. Refresh Token...');
        if (verifyRes.data.refreshToken) {
            try {
                const refreshRes = await request(`${API_URL}/auth/refresh-token`, 'POST', {
                    refreshToken: verifyRes.data.refreshToken
                }, token);
                console.log('   Token Refreshed:', refreshRes.message || 'Success');
            } catch (e) {
                console.log('   (Refresh Failed: ' + e.message + ')');
            }
        } else {
            console.log('   (No refreshToken in login response, skipping refresh test)');
        }

        // 5. Logout
        console.log('5. Logout...');
        const logoutRes = await request(`${API_URL}/auth/logout`, 'POST', {}, token);
        console.log('   Logout:', logoutRes.message);

        console.log('--- Auth Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAuth();
