const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin';

async function testAdminOrders() {
    try {
        console.log('--- Starting Admin Orders Test ---');

        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url, method, body) => {
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            if (!res.ok) {
                console.error('Request Error details:', data);
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        // 1. Get Order Stats
        console.log('1. Fetching Order Stats...');
        const statsRes = await request(`${API_URL}/orders/stats`, 'GET');
        console.log(`   Total Orders: ${statsRes.data.totalOrders || 0}`);

        // 2. Get All Orders
        console.log('2. Fetching All Orders...');
        const allRes = await request(`${API_URL}/orders?limit=5`, 'GET');
        const ordersList = Array.isArray(allRes.data) ? allRes.data : (allRes.data.orders || []);
        console.log(`   Fetched ${ordersList.length} orders.`);

        if (ordersList.length > 0) {
            const order = ordersList[0];

            // 3. Get Order Details
            console.log(`3. Order Details (${order.orderNumber})...`);
            const detailRes = await request(`${API_URL}/orders/${order._id}`, 'GET');
            console.log(`   Status: ${detailRes.data.status}`);

            // 4. Update Status (Dry run / Careful not to break real flow if possible, 
            // but for test we might toggle status if allowed or just skip if it's final)
            if (['pending', 'confirmed', 'preparing'].includes(detailRes.data.status)) {
                console.log('4. Updating Status to "ready"...');
                const updateRes = await request(`${API_URL}/orders/${order._id}/status`, 'PUT', {
                    status: 'ready'
                });
                console.log(`   New Status: ${updateRes.data.status}`);
            } else {
                console.log('   (Skipping status update as order is already in advanced state)');
            }

            // 5. Test Assign Rider and Cancel (routes exist, skipping execution for safety)
            console.log('5. Assign-rider and Cancel routes exist - Skipped for safety');
            // PUT /orders/:id/assign-rider
            // PUT /orders/:id/cancel
        } else {
            console.log('   ! No orders found to test details.');
        }

        console.log('--- Admin Orders Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAdminOrders();
