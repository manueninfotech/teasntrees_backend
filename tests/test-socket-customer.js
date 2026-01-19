const io = require('../backend/node_modules/socket.io-client');
const { getAdminToken } = require('./admin/test-auth');

const SIO_URL = 'http://localhost:5000';
const CUSTOMER_API_URL = 'http://localhost:5000/api/customer';
const ADMIN_API_URL = 'http://localhost:5000/api/admin';
const CUSTOMER_MOBILE = '8888888888';

async function testCustomerSocket() {
    console.log('--- Starting Customer Socket Verification Test ---');

    let customerToken, adminToken, socket, orderId;

    try {
        // --- 1. SETUP ---

        // 1a. Login Customer
        console.log('1. Logging in Customer...');
        const otpRes = await fetch(`${CUSTOMER_API_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: CUSTOMER_MOBILE })
        });

        let otp = '123456';
        if (otpRes.ok) {
            const data = await otpRes.json();
            if (data.data && data.data.otp) otp = data.data.otp;
        }

        const verifyRes = await fetch(`${CUSTOMER_API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: CUSTOMER_MOBILE, otp: otp })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error('Customer login failed: ' + verifyData.message);
        customerToken = verifyData.data.token;
        console.log('   Customer Logged In.');

        // 1b. Login Admin
        console.log('2. Logging in Admin...');
        adminToken = await getAdminToken();
        if (!adminToken) throw new Error('Admin login failed');
        console.log('   Admin Logged In.');

        // 1c. Create Order
        console.log('3. Creating Test Order...');
        // Get a product first
        const prodRes = await fetch(`${CUSTOMER_API_URL}/products?limit=1`);
        const prodData = await prodRes.json();
        if (!prodData.data.products || prodData.data.products.length === 0) throw new Error('No products found');
        const product = prodData.data.products[0];

        const orderRes = await fetch(`${CUSTOMER_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`
            },
            body: JSON.stringify({
                items: [{ product: product._id, quantity: 1, price: product.price }],
                deliveryAddress: 'Socket Test Address',
                paymentMethod: 'COD'
            })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error('Order creation failed: ' + orderData.message);
        orderId = orderData.data.orderId; // Note: check if it returns _id or orderId
        // Usually returns { data: { orderId: "...", orderNumber: "..." } }
        // We might need the internal _id for Admin API updates if the route expects _id
        // Let's get the full order object to be sure
        const orderDetailsRes = await fetch(`${CUSTOMER_API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });
        const orderDetails = await orderDetailsRes.json();
        const orderInternalId = orderDetails.data._id;

        console.log(`   Order Created: ${orderData.data.orderNumber} (ID: ${orderInternalId})`);


        // --- 2. SOCKET CONNECTION ---

        console.log('4. Connecting Customer Socket...');
        socket = io(SIO_URL, {
            auth: { token: customerToken },
            transports: ['websocket']
        });

        const connectPromise = new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', (e) => reject('Connection error: ' + e.message));
        });
        await connectPromise;
        console.log('   Socket Connected:', socket.id);


        // --- 3. TEST LOGIC ---

        // Listen for 'order:status-updated'
        const eventPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject('Timeout waiting for order update'), 10000);

            socket.on('order:status-updated', (data) => {
                if (data.orderId === orderInternalId || data.orderNumber === orderData.data.orderNumber) {
                    clearTimeout(timeout);
                    console.log('   EVENT RECEIVED: order:status-updated');
                    console.log(`   New Status: ${data.status}`);
                    resolve(data);
                } else {
                    console.log('   Ignored event for different order:', data.orderNumber);
                }
            });
        });

        // Trigger Update via Admin API
        console.log('5. Admin updating order status to "confirmed"...');
        // Admin Update Route: PUT /api/admin/orders/:id/status
        const updateRes = await fetch(`${ADMIN_API_URL}/orders/${orderInternalId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: 'confirmed' })
        });

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            console.error('   Admin Update Error Body:', errText);
            throw new Error('Admin update failed: ' + updateRes.status + ' ' + updateRes.statusText);
        }
        console.log('   Admin Update Sent.');

        // Wait for event
        console.log('6. Waiting for Notification...');
        await eventPromise;
        console.log('   Success! Customer received order update.');

        console.log('--- Customer Socket Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    } finally {
        if (socket) socket.close();
    }
}

if (require.main === module) {
    testCustomerSocket();
}

module.exports = { testCustomerSocket };
