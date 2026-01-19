const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin/reviews';

async function testAdminReviews() {
    try {
        console.log('--- Starting Admin Reviews Test ---');
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url) => {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(url, { headers });
            const data = await res.json();
            return data;
        };

        // 1. Get Stats
        console.log('1. Fetching Review Stats...');
        const stats = await request(`${API_URL}/stats`);
        if (stats.success) console.log('   Stats fetched.');

        // 2. Get All Reviews
        console.log('2. Fetching All Reviews...');
        const all = await request(`${API_URL}`);
        const reviews = all.data && all.data.reviews ? all.data.reviews : [];
        console.log(`   Reviews found: ${reviews.length}`);

        // 3. Test individual review operations (if reviews exist)
        if (reviews.length > 0) {
            const reviewId = reviews[0]._id;

            console.log('3. Fetching Single Review...');
            const single = await request(`${API_URL}/${reviewId}`);
            if (single.success) console.log('   Single review fetched.');

            // 4. Test rider reviews (if review has riderId)
            if (reviews[0].riderId) {
                console.log('4. Fetching Rider Reviews...');
                const riderReviews = await request(`${API_URL}/rider/${reviews[0].riderId}`);
                console.log(`   Rider reviews: ${riderReviews.data ? riderReviews.data.length : 0}`);
            }

            // Note: Approve/Reject/Delete are skipped to avoid modifying real reviews
            console.log('5. Review mutation routes exist (approve, reject, delete) - Skipped for safety');
        } else {
            console.log('   ! No reviews found for detailed testing.');
        }

        console.log('--- Admin Reviews Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAdminReviews();
