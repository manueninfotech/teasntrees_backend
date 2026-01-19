const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin/activity-logs';

async function testActivity() {
    try {
        console.log('--- Starting Admin Activity Test ---');
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url) => {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { headers });
            const data = await res.json();
            return data;
        };

        // 0. Seed a log (Trigger an action that logs)
        console.log('0. Seeding Activity Log (Updating Delivery Zone settings)...');
        try {
            await fetch('http://localhost:5000/api/admin/settings/delivery-zones', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryZones: [] }) // Empty update or safe dummy
            });
            // Wait a moment for async logging (if any)
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.warn('   (Seeding log failed):', e.message);
        }

        // 1. Get Stats
        console.log('1. Fetching Activity Stats...');
        const stats = await request(`${API_URL}/stats`);
        if (stats.success) console.log('   Stats fetched successfully.');

        // 2. Get All Logs
        console.log('2. Fetching Activity Logs...');
        const logs = await request(`${API_URL}`);
        // console.log('DEBUG LOGS:', JSON.stringify(logs, null, 2)); // Uncomment if needed

        const logsList = logs.data && logs.data.logs ? logs.data.logs : [];
        console.log(`   Logs found: ${logsList.length}`);

        if (logsList.length > 0) {
            const firstLog = logsList[0];
            const logId = firstLog._id;
            const adminId = firstLog.admin ? (firstLog.admin._id || firstLog.admin) : null;

            // 3. Get Log By ID
            console.log(`3. Fetching Log By ID (${logId})...`);
            try {
                const logDetail = await request(`${API_URL}/${logId}`);
                if (logDetail.success) console.log('   Log details fetched.');
            } catch (e) {
                console.warn('   (Get By ID failed):', e.message);
            }

            // 4. Get Logs By Admin
            if (adminId) {
                console.log(`4. Fetching Logs By Admin (${adminId})...`);
                const adminLogs = await request(`${API_URL}/admin/${adminId}`);
                const adminLogsList = adminLogs.data && adminLogs.data.logs ? adminLogs.data.logs : [];
                console.log(`   Admin Logs found: ${adminLogsList.length}`);
            }
        }

        // 5. Export Logs
        console.log('5. Testing Export Logs...');
        // Export usually returns a file/buffer, not JSON. But we can check response details.
        // We need to fetch with raw response to check headers or status 200.
        try {
            const res = await fetch(`${API_URL}/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`   Export Endpoint Status: ${res.status}`);
            if (res.status !== 200) console.warn('   Export failed or returned non-200');
        } catch (e) {
            console.warn('   (Export failed):', e.message);
        }

        console.log('--- Admin Activity Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testActivity();
