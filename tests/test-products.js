const API_URL = 'http://localhost:5000/api/customer';

async function testProducts() {
    try {
        console.log('--- Starting Products Test ---');

        const request = async (url) => {
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Request failed');
            return data;
        };

        // 1. Get All Products
        console.log('1. Fetching All Products...');
        const allRes = await request(`${API_URL}/products?limit=5`);
        console.log(`   Fetched ${allRes.data.products.length} products.`);

        if (allRes.data.products.length === 0) throw new Error('No products found in DB');
        const sample = allRes.data.products[0];

        // 2. Get Single Product
        console.log(`2. Fetching Single Product (${sample._id})...`);
        const oneRes = await request(`${API_URL}/products/${sample._id}`);
        if (oneRes.data._id !== sample._id) throw new Error('Product ID mismatch');
        console.log('   Verified.');

        // 3. Search
        console.log(`3. Searching for "${sample.name.substring(0, 3)}"...`);
        const searchRes = await request(`${API_URL}/products?search=${sample.name.substring(0, 3)}`);
        console.log(`   Found ${searchRes.data.products.length} matches.`);

        // 4. Categories
        console.log('4. Fetching Categories...');
        const catRes = await request(`${API_URL}/categories`);
        console.log(`   Found ${catRes.data.length} categories.`);

        if (catRes.data.length > 0) {
            const catId = catRes.data[0]._id;
            console.log(`5. Fetching Products by Category (${catRes.data[0].name})...`);
            const byCatRes = await request(`${API_URL}/products/category/${catId}`);
            console.log(`   Found ${byCatRes.data.length} products in category.`);
        }

        console.log('--- Products Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testProducts();
