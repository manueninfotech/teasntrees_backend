const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testNotificationPreferences() {
    try {
        console.log('--- Starting Notification Preferences Test ---');

        // Helper for fetch requests
        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            const data = await res.json();
            if (!res.ok) {
                console.error(`Error ${res.status} on ${url}:`, data.message);
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        // 1. Login
        console.log('1. Logging in...');
        let otp = '123456';
        try {
            const otpRes = await request(`${API_URL}/auth/send-otp`, 'POST', { mobile: MOBILE });
            if (otpRes.data && otpRes.data.otp) otp = otpRes.data.otp;
        } catch (e) { }

        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', {
            mobile: MOBILE,
            otp
        });
        const token = verifyRes.data.token;
        console.log('   Logged in.');

        // 2. Fetch Initial Profile
        console.log('2. Fetching Profile (Initial)...');
        const profileRes = await request(`${API_URL}/profile`, 'GET', null, token);
        const initialPrefs = profileRes.data.user.notificationPreferences;
        console.log('   Initial Preferences:', initialPrefs || 'None');

        // 3. Update Preferences
        console.log('3. Updating Preferences (Disable SMS)...');
        const updateRes = await request(`${API_URL}/profile`, 'PUT', {
            notificationPreferences: {
                sms: false,
                email: true, // Should remain true or set explicitly
                offers: false
            }
        }, token);

        const updatedPrefs = updateRes.data.user.notificationPreferences;
        console.log('   Updated Preferences in Response:', updatedPrefs);

        if (updatedPrefs.sms === false && updatedPrefs.email === true && updatedPrefs.offers === false) {
            console.log('   Create/Update Success: SMS disabled, Offers disabled.');
        } else {
            throw new Error('Update failed: Preferences do not match request.');
        }

        // 4. Verify Persistence
        console.log('4. Verifying Persistence...');
        const verifyProfileRes = await request(`${API_URL}/profile`, 'GET', null, token);
        const persistentPrefs = verifyProfileRes.data.user.notificationPreferences;

        if (JSON.stringify(persistentPrefs) === JSON.stringify(updatedPrefs)) {
            console.log('   Persistence Verified.');
        } else {
            throw new Error('Persistence failed: Fetched profile mismatch.');
        }

        console.log('--- Test Passed Successfully ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testNotificationPreferences();
