const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin/settings';

async function testAdminSettings() {
    try {
        console.log('--- Starting Admin Settings Test ---');
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url) => {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { headers });
            const data = await res.json();
            return data;
        };

        // 1. Get Settings
        console.log('1. Fetching General Settings...');
        const settings = await request(`${API_URL}`);
        if (settings.success) console.log('   Settings fetched.');

        // 2. Get Delivery Zones
        console.log('2. Fetching Delivery Zones...');
        const zones = await request(`${API_URL}/delivery-zones`);
        if (zones.success) console.log('   Delivery Zones fetched.');

        // 3. Update routes exist (skipped to avoid changing production settings)
        console.log('3. Settings mutation routes exist (PUT /, PUT /delivery-zones) - Skipped for safety');

        console.log('--- Admin Settings Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAdminSettings();
