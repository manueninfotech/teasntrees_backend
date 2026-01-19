const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testReviews() {
    try {
        console.log('--- Starting Reviews Test ---');

        // Helper
        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            // 400 is ok if it says "already reviewed"
            if (!res.ok) {
                if (res.status === 400 && data.message && data.message.includes('already')) return data;
                // We return error data instead of throwing immediately to handle 404 gracefully
                return { error: true, status: res.status, ...data };
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
        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', { mobile: MOBILE, otp });
        const token = verifyRes.data.token;
        console.log('   Logged in.');

        // 2. Find a Delivered Order
        console.log('2. Finding Delivered Order to Review...');
        const ordersRes = await request(`${API_URL}/orders/my-orders?status=delivered`, 'GET', null, token);

        let deliveredOrder = null;
        if (ordersRes.data && ordersRes.data.orders.length > 0) {
            deliveredOrder = ordersRes.data.orders[0];
            console.log(`   Found Delivered Order: ${deliveredOrder.orderNumber}`);
        } else {
            console.log('   ! No delivered orders found. Skipping create review test.');
        }

        // 3. Post Review (Only if order found)
        if (deliveredOrder) {
            console.log('3. Posting Order Review...');
            const reviewRes = await request(`${API_URL}/reviews`, 'POST', {
                orderId: deliveredOrder._id,
                foodRating: 5,
                riderRating: 5,
                review: 'Automated test review - Great service!',
            }, token);

            if (reviewRes.error) {
                if (reviewRes.status === 400 && reviewRes.message.includes('already')) {
                    console.log('   (Order already reviewed, passed)');
                } else {
                    console.error('   Review Failed:', reviewRes.message);
                }
            } else {
                console.log('   Review Posted Successfully');
            }
        }

        // 4. Get Product Reviews (Generic check)
        // Find a product first
        const productsRes = await request(`${API_URL}/products?limit=1`, 'GET');
        if (productsRes.data && productsRes.data.products.length > 0) {
            const product = productsRes.data.products[0];
            console.log(`4. Fetching Reviews for Product: ${product.name}...`);
            const getRes = await request(`${API_URL}/reviews/product/${product._id}`, 'GET');
            console.log(`   Reviews Found: ${getRes.data ? getRes.data.reviews.length : 0}`);
        }

        // 5. Get My Reviews
        console.log('5. Fetching My Reviews...');
        const myRes = await request(`${API_URL}/reviews/my-reviews`, 'GET', null, token);
        console.log(`   My Reviews: ${myRes.data ? myRes.data.reviews.length : 0}`);

        console.log('--- Reviews Test Finished ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testReviews();
