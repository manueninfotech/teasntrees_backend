const API_URL = 'http://localhost:5000/api/customer';

async function testCategories() {
    try {
        console.log('--- Starting Category Test ---');

        const request = async (url) => {
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Request failed');
            return data;
        };

        // 1. Get All Categories
        console.log('1. Fetching All Categories...');
        const allRes = await request(`${API_URL}/categories`);
        console.log(`   Found ${allRes.data.length} categories.`);

        if (allRes.data.length > 0) {
            const cat = allRes.data[0];

            // 2. Get Single Category
            console.log(`2. Fetching Single Category (${cat.name})...`);
            const oneRes = await request(`${API_URL}/categories/${cat._id}`);
            if (oneRes.data._id !== cat._id) throw new Error('Category ID mismatch');
            console.log('   Verified.');
        } else {
            console.log('   ! No categories found to test detail view.');
        }

        console.log('--- Category Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testCategories();
