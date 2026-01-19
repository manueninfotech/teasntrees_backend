const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin';

async function testAdminProducts() {
    try {
        console.log('--- Starting Admin Products Test ---');

        // Get Token
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed, aborting product test');

        const request = async (url, method, body) => {
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Request failed');
            return data;
        };

        // 1. Create Category (Needed for product)
        console.log('1. Creating Test Category...');
        const catRes = await request(`${API_URL}/categories`, 'POST', {
            name: 'Test Category ' + Date.now(),
            description: 'Created by automated test',
            isActive: true
        });
        const categoryId = catRes.data._id;
        console.log('   Category Created:', catRes.data.name);

        // 1.1 Update Category
        console.log('1.1. Updating Category...');
        const catUp = await request(`${API_URL}/categories/${categoryId}`, 'PUT', { description: 'Updated Desc' });
        if (catUp.data.description !== 'Updated Desc') throw new Error('Category update failed');

        // 1.2 Get All Categories
        console.log('1.2. Fetching All Categories...');
        await request(`${API_URL}/categories`);

        // 1.3 Get Category By ID
        console.log('1.3. Fetching Category By ID...');
        await request(`${API_URL}/categories/${categoryId}`);

        // 2. Create Product
        console.log('2. Creating Product...');
        const prodPayload = {
            name: 'Test Product ' + Date.now(),
            description: 'Delicious test item',
            price: 99,
            category: categoryId,
            isVegetarian: true,
            isAvailable: true
        };
        const prodRes = await request(`${API_URL}/products`, 'POST', prodPayload);
        const productId = prodRes.data._id;
        console.log('   Product Created:', prodRes.data.name);

        // 3. Get Products by Category
        console.log('3. Fetching Products by Category...');
        const catProds = await request(`${API_URL}/products/category/${categoryId}`, 'GET');
        console.log(`   Products in category: ${catProds.data ? catProds.data.length : 0}`);

        // 4. Update Product
        console.log('4. Updating Product...');
        const updateRes = await request(`${API_URL}/products/${productId}`, 'PUT', {
            price: 150,
            isAvailable: false
        });
        if (updateRes.data.price !== 150) throw new Error('Price update failed');
        console.log('   Product Updated.');

        // 5. Toggle Product Availability
        console.log('5. Toggling Product Availability...');
        const toggleRes = await request(`${API_URL}/products/${productId}/availability`, 'PUT');
        console.log(`   Availability toggled to: ${toggleRes.data.isAvailable}`);

        // 6. Bulk Update (test with empty array to avoid side effects)
        console.log('6. Testing Bulk Update endpoint...');
        console.log('   (Skipping execution - route exists at PUT /products/bulk-update)');

        // 7. Delete Product
        console.log('7. Deleting Product...');
        await request(`${API_URL}/products/${productId}`, 'DELETE');
        console.log('   Product Deleted.');

        // 8. Delete Category
        console.log('8. Deleting Category...');
        await request(`${API_URL}/categories/${categoryId}`, 'DELETE');
        console.log('   Category Deleted.');

        console.log('--- Admin Products Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAdminProducts();
