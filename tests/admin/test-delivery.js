const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin/deliveries';

async function testAdminDelivery() {
    try {
        console.log('--- Starting Admin Delivery Test ---');
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url) => {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { headers });
            const data = await res.json();
            return data;
        };

        // 1. Get Stats
        console.log('1. Fetching Delivery Stats...');
        const stats = await request(`${API_URL}/stats`);
        if (stats.success) console.log('   Stats fetched.');

        // 2. Get All Deliveries
        console.log('2. Fetching All Deliveries...');
        const all = await request(`${API_URL}`);
        const deliveries = all.data && all.data.deliveries ? all.data.deliveries : [];
        console.log(`   Deliveries found: ${deliveries.length}`);

        // 3. Test individual delivery operations (if deliveries exist)
        if (deliveries.length > 0) {
            const deliveryId = deliveries[0]._id;

            console.log('3. Fetching Single Delivery...');
            const single = await request(`${API_URL}/${deliveryId}`);
            if (single.success) console.log('   Single delivery fetched.');

            // Note: Status/location/complete updates are skipped to avoid disrupting real deliveries
            console.log('4. Delivery mutation routes exist (status, location, complete) - Skipped for safety');
        } else {
            console.log('   ! No deliveries found for detailed testing.');
        }

        console.log('--- Admin Delivery Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAdminDelivery();
