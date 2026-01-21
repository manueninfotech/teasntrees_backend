const { getRiderToken } = require('./test-rider-auth');
const API_URL = 'http://localhost:5000/api/rider/deliveries';

async function testRiderDelivery() {
    console.log('\n--- Starting Rider Delivery Test ---');
    try {
        const token = await getRiderToken();
        if (!token) throw new Error('Auth failed - cannot test deliveries');

        const request = async (url, method = 'GET', body = null) => {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await res.json();
            // 404 is acceptable for "getActiveDelivery" if none active
            if (!res.ok && res.status !== 404) throw new Error(data.message || 'Request failed');
            return { status: res.status, data };
        };

        // 1. Get Active Delivery
        console.log('1. Fetching Active Delivery...');
        const activeRes = await request(`${API_URL}/active`);

        if (activeRes.status === 200 && activeRes.data.success) {
            console.log('   Active Delivery Found:', activeRes.data.data._id);
            // Could add tests for status updates here if we had a mock delivery pipeline
        } else {
            console.log('   No active delivery found (Expected 404 or null data).');
        }

        // 2. Earnings History
        console.log('2. Fetching Earnings History...');
        const earningsRes = await request(`${API_URL}/earnings`);
        if (earningsRes.data.success) {
            const history = earningsRes.data.data;
            console.log(`   Earnings History: ${history.length} records found.`);
        }

        // 3. Update Location (Mock)
        console.log('3. Updating Location...');
        const locRes = await request(`${API_URL}/location`, 'PUT', {
            latitude: 12.9716,
            longitude: 77.5946
        });
        if (locRes.data.success) console.log('   Location updated.');

        console.log('--- Rider Delivery Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

if (require.main === module) {
    testRiderDelivery();
}

module.exports = testRiderDelivery;
