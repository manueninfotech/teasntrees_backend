const API_URL = 'http://localhost:5000/api/admin';
const CUSTOMER_API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888'; // Admin mobile? No, need admin login.

async function testDashboard() {
    try {
        console.log('--- Starting Admin Dashboard Test ---');

        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Request failed');
            return data;
        };

        // 1. Admin Login
        // We need an admin user. Assuming 'admin' role exists for test user or we use a known admin.
        // For this test environment, let's assume we have an admin credentials or use the OTP flow if the user is admin.
        // If 8888888888 is customer, this might fail access check.
        // Let's try to login as admin.
        console.log('1. Admin Login...');
        // Note: In development, we might not have a dedicated admin login script exposed easily without knowing the admin mobile.
        // I'll check if there's an admin seeded. If not, I'll use the customer login and hope roles allow it? No, middleware blocks it.
        // WA: I will create a temporary admin or use the existing admin auth route if available.
        // Look at adminAuthRoutes.js... likely uses same OTP flow but checks role.

        let adminToken = '';
        try {
            // Try standard OTP flow
            const otpRes = await request(`http://localhost:5000/api/admin/auth/send-otp`, 'POST', { mobile: '9999999999' }); // Assuming 9999999999 is admin
            let otp = '123456';
            if (otpRes.data && otpRes.data.otp) otp = otpRes.data.otp;

            const verifyRes = await request(`http://localhost:5000/api/admin/auth/verify-otp`, 'POST', { mobile: '9999999999', otp });
            adminToken = verifyRes.data.token;
            console.log('   Admin Logged In.');
        } catch (e) {
            console.log('   ! Admin Login Failed (Account 9999999999 might not exist). Trying 8888888888 if it is admin...');
            // Fallback logic not robust here without knowing Admin Mobile.
            // I will skip login if it fails and assume I cannot run admin tests without credentials.
            throw new Error('Cannot run dashboard test without Admin Credentials');
        }

        // 2. Get Stats
        console.log('2. Fetching Dashboard Stats...');
        const stats = await request(`${API_URL}/dashboard/stats`, 'GET', null, adminToken);
        console.log('   Stats Received:', stats.data.overview);
        if (stats.data.overview.totalRevenue === undefined) throw new Error('Missing revenue in stats');

        // 3. Get Revenue Charts
        console.log('3. Fetching Revenue Chart Data...');
        const revenue = await request(`${API_URL}/dashboard/revenue?period=week`, 'GET', null, adminToken);
        console.log(`   Data Points: ${revenue.data.length}`);

        // 4. Get Top Products
        console.log('4. Fetching Top Products...');
        const top = await request(`${API_URL}/dashboard/top-products`, 'GET', null, adminToken);
        console.log(`   Top Products: ${top.count}`);
        if (top.data.length > 0) {
            console.log(`   #1 Product: ${top.data[0].name} (Sold: ${top.data[0].orderCount || 0})`);
        }

        // 5. Get Recent Orders
        console.log('5. Fetching Recent Orders...');
        const recent = await request(`${API_URL}/dashboard/recent-orders`, 'GET', null, adminToken);
        console.log(`   Recent Orders: ${recent.data ? recent.data.length : 0}`);

        console.log('--- Dashboard Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testDashboard();
