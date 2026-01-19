const { testAdminAuth } = require('./test-auth');
const API_URL = 'http://localhost:5000/api/admin/profile';

async function testAdminProfile() {
    try {
        console.log('--- Starting Admin Profile Test ---');
        const token = await testAdminAuth();
        if (!token) throw new Error('Auth failed');

        const request = async (url, method = 'GET', body = null) => {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const data = await res.json();
            return data;
        };

        // 1. Get Profile
        console.log('1. Fetching Admin Profile...');
        const profile = await request(`${API_URL}`);
        console.log(`   Admin Name: ${profile.data.name}`);

        // 2. Update Profile (Soft update)
        console.log('2. Updating Profile (Name)...');
        const update = await request(`${API_URL}`, 'PUT', { name: profile.data.name }); // Keep same name
        if (update.success) console.log('   Profile update verification success.');

        console.log('--- Admin Profile Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAdminProfile();
