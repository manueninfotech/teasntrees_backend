const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testOrderFeatures() {
    try {
        console.log('--- Starting Order Features Test ---');

        // Helper for fetch requests
        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            // Handle PDF stream separately
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                return { isPdf: true, size: parseInt(res.headers.get('content-length') || '0') };
            }

            const data = await res.json();
            if (!res.ok) {
                // Log detailed error if available
                console.error(`Error ${res.status} on ${url}:`, data.message);
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        // 1. Login
        console.log('1. Logging in...');
        let otp = '123456';

        // Try to get OTP from response (works in Development mode)
        try {
            const otpRes = await request(`${API_URL}/auth/send-otp`, 'POST', { mobile: MOBILE });
            if (otpRes.data && otpRes.data.otp) {
                otp = otpRes.data.otp;
                console.log('   Using OTP from response:', otp);
            }
        } catch (e) {
            console.log('   Send OTP warning:', e.message);
        }

        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', {
            mobile: MOBILE,
            otp
        });
        const token = verifyRes.data.token;
        console.log('   Logged in successfully.');

        // 2. Prepare Order
        console.log('2. checking for existing orders...');
        let ordersRes = await request(`${API_URL}/orders/my-orders`, 'GET', null, token);
        let orderId;

        if (ordersRes.data.orders.length === 0) {
            console.log('   No existing orders. Creating a new one...');

            // Need a product to order
            const productsRes = await request(`${API_URL}/products?limit=1`, 'GET');
            const products = productsRes.data.products || [];

            if (products.length === 0) {
                throw new Error('No products found in database. Cannot test order creation. Please seed products first.');
            }

            const product = products[0];
            console.log(`   Ordering product: ${product.name} (ID: ${product._id})`);

            const newOrder = await request(`${API_URL}/orders`, 'POST', {
                items: [{ product: product._id, quantity: 1, price: product.price }],
                deliveryAddress: '123 Test St, Test City',
                paymentMethod: 'COD'
            }, token);

            orderId = newOrder.data.orderId;
            console.log('   Created new order:', newOrder.data.orderNumber);
        } else {
            orderId = ordersRes.data.orders[0]._id;
            console.log('   Using existing order:', ordersRes.data.orders[0].orderNumber);
        }

        // 3. Test Search
        console.log('3. Testing Search...');
        const searchRes = await request(`${API_URL}/orders/my-orders?search=ORD`, 'GET', null, token);
        console.log(`   Search found ${searchRes.data.orders.length} orders matching 'ORD'.`);

        // 4. Test Reorder
        console.log(`4. Testing Reorder for ${orderId}...`);
        const reorderRes = await request(`${API_URL}/orders/${orderId}/reorder`, 'POST', null, token);
        console.log('   Reorder Success. New Order:', reorderRes.data.orderNumber);
        const newOrderId = reorderRes.data.orderId;

        // 5. Test Invoice Download
        console.log(`5. Downloading Invoice for ${newOrderId}...`);
        const invoiceRes = await request(`${API_URL}/orders/${newOrderId}/invoice`, 'GET', null, token);

        if (invoiceRes.isPdf) {
            console.log('   Invoice PDF received successfully (Size:', invoiceRes.size, 'bytes).');
        } else {
            console.error('   Failed to receive PDF.');
        }

        console.log('--- Test Passed Successfully ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testOrderFeatures();
