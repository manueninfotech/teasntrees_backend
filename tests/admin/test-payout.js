
const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testPayouts() {
    console.log('\n=== Testing Admin Payouts ===');

    try {
        // 1. Send OTP
        const mobile = '9999999999';
        await axios.post(`${API_URL}/admin/auth/send-otp`, { mobile });

        // 2. Login (Complete flow)
        let token;
        const verifyRes = await axios.post(`${API_URL}/admin/auth/verify-otp`, {
            mobile,
            otp: '123456'
        });

        if (verifyRes.data.data.isProfileComplete) {
            token = verifyRes.data.data.token;
        } else {
            const completeRes = await axios.post(`${API_URL}/admin/auth/complete-profile`, {
                mobile,
                name: 'Test Admin',
                email: 'admin.payout@teasntrees.com',
                address: 'Admin HQ'
            });
            token = completeRes.data.data.token;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Get Payout Stats
        console.log('GET /admin/payouts/stats');
        const statsRes = await axios.get(`${API_URL}/admin/payouts/stats`, { headers });
        console.log('✅ Status:', statsRes.status);
        console.log('📊 Stats:', JSON.stringify(statsRes.data.data, null, 2));

        if (statsRes.data.data.length > 0) {
            const riderId = statsRes.data.data[0].riderId;

            // 4. Process Payout
            console.log(`POST /admin/payouts/process (Rider: ${riderId})`);
            const processRes = await axios.post(`${API_URL}/admin/payouts/process`,
                { riderId },
                { headers }
            );
            console.log('✅ Status:', processRes.status);
            console.log('✅ Response:', processRes.data.message);
        } else {
            console.log('ℹ️ No unpaid riders found, skipping process payout.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data?.message || error.message);
        if (error.response?.data) console.error(error.response.data);
    }
}

if (require.main === module) {
    testPayouts();
}

module.exports = testPayouts;
