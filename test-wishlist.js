const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testWishlist() {
    try {
        console.log('--- Starting Wishlist Test ---');

        // Helper for fetch requests
        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            const data = await res.json();
            if (!res.ok) {
                console.error(`Error ${res.status} on ${url}:`, data.message);
                throw new Error(data.message || 'Request failed');
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

        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', {
            mobile: MOBILE,
            otp
        });
        const token = verifyRes.data.token;
        console.log('   Logged in.');

        // 2. Clear existing wishlist
        console.log('2. Clearing / Fetching Wishlist...');
        const initialListRes = await request(`${API_URL}/wishlist`, 'GET', null, token);
        const initialItems = initialListRes.data || [];
        console.log(`   Initial items: ${initialItems.length}`);

        for (const item of initialItems) {
            await request(`${API_URL}/wishlist/remove/${item._id}`, 'DELETE', null, token);
        }
        console.log('   Wishlist cleared.');

        // 3. Get a Product ID to add
        console.log('3. Fetching a product to add...');
        const productsRes = await request(`${API_URL}/products?limit=1`, 'GET', null, token);
        if (!productsRes.data.products || productsRes.data.products.length === 0) {
            throw new Error('No products found to test wishlist.');
        }
        const productId = productsRes.data.products[0]._id;
        console.log(`   Selected Product ID: ${productId}`);

        // 4. Add to Wishlist
        console.log('4. Adding to Wishlist...');
        const addRes = await request(`${API_URL}/wishlist/add`, 'POST', { productId }, token);
        console.log('   Added. Wishlist size:', addRes.data.length);

        if (!addRes.data.some(p => p._id === productId)) {
            throw new Error('Product not found in wishlist response after adding.');
        }

        // 5. Verify Persistence
        console.log('5. Verifying Persistence...');
        const getRes = await request(`${API_URL}/wishlist`, 'GET', null, token);
        if (!getRes.data.some(p => p._id === productId)) {
            throw new Error('Product not found in fetched wishlist.');
        }
        console.log('   Persistence Verified.');

        // 6. Remove from Wishlist
        console.log('6. Removing from Wishlist...');
        const removeRes = await request(`${API_URL}/wishlist/remove/${productId}`, 'DELETE', null, token);
        console.log('   Removed. Wishlist size:', removeRes.data.length);

        if (removeRes.data.some(p => p._id === productId)) {
            throw new Error('Product still present after removal.');
        }

        console.log('--- Test Passed Successfully ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testWishlist();
