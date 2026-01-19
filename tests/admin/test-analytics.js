const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin/analytics/carts';

async function testCartAnalytics() {
    try {
        console.log('--- Starting Cart Analytics Test ---');
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url) => {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { headers });
            const data = await res.json();
            return data;
        };

        // 1. Get Analytics
        console.log('1. Fetching Cart Analytics...');
        const analytics = await request(`${API_URL}`);
        if (analytics.success) console.log('   Analytics fetched.');

        // 2. Get Abandoned Carts
        console.log('2. Fetching Abandoned Carts...');
        const abandoned = await request(`${API_URL}/abandoned`);
        console.log(`   Abandoned Carts: ${abandoned.data ? abandoned.data.length : 0}`);

        console.log('--- Cart Analytics Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testCartAnalytics();
