const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888';

async function testCart() {
    try {
        console.log('--- Starting Cart Test ---');

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

        // 2. Clear Cart (Start fresh)
        console.log('2. Clearing Cart...');
        await request(`${API_URL}/cart/clear`, 'DELETE', null, token);

        // 3. Get Product to Add
        console.log('3. Fetching Product...');
        const productsRes = await request(`${API_URL}/products?limit=1`, 'GET');
        const product = productsRes.data.products[0];
        console.log(`   Found Product: ${product.name} (${product._id})`);

        // 4. Add to Cart
        console.log('4. Adding to Cart...');
        const addRes = await request(`${API_URL}/cart/add`, 'POST', {
            productId: product._id,
            quantity: 2,
            customization: 'Extra test sauce'
        }, token);
        console.log(`   Cart Items: ${addRes.data.items.length}`);

        const cartItem = addRes.data.items.find(i => i.product._id === product._id || i.product === product._id);
        const itemId = cartItem._id;
        console.log(`   Cart Item ID: ${itemId}`);

        // 5. Update Quantity
        console.log('5. Updating Quantity...');
        const updateRes = await request(`${API_URL}/cart/item/${itemId}`, 'PUT', {
            quantity: 5
        }, token);
        const updatedItem = updateRes.data.items.find(i => i._id === itemId);
        console.log(`   New Quantity: ${updatedItem.quantity}`);
        if (updatedItem.quantity !== 5) throw new Error('Quantity update failed');

        // 6. Remove Item
        console.log('6. Removing Item...');
        const removeRes = await request(`${API_URL}/cart/item/${itemId}`, 'DELETE', null, token);
        if (removeRes.data.items.length !== 0) throw new Error('Remove failed');
        console.log('   Item removed.');

        console.log('--- Cart Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testCart();
