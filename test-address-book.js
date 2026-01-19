const API_URL = 'http://localhost:5000/api/customer';
const MOBILE = '8888888888'; // Test mobile

async function testAddressBook() {
    try {
        console.log('--- Starting Address Book Test ---');

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
                throw new Error(data.message || 'Request failed');
            }
            return data;
        };

        // 1. Send OTP
        console.log('1. Sending OTP...');
        await request(`${API_URL}/auth/send-otp`, 'POST', { mobile: MOBILE });

        // 2. Verify OTP
        const otp = '123456';
        console.log(`2. Verifying OTP with ${otp}...`);

        const verifyRes = await request(`${API_URL}/auth/verify-otp`, 'POST', {
            mobile: MOBILE,
            otp
        });

        let token = verifyRes.data.token;

        // If profile not complete, complete it
        if (!verifyRes.data.user?.isProfileComplete) {
            console.log('3a. Completing Profile...');
            const completeRes = await request(`${API_URL}/auth/complete-profile`, 'POST', {
                mobile: MOBILE,
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                address: 'Initial Address' // Required by API even if we use address book later
            });
            token = completeRes.data.token;
        }

        // 3. Add Address 1
        console.log('3. Adding Home Address...');
        const addr1 = await request(`${API_URL}/address`, 'POST', {
            label: 'Home',
            addressLine: '123 Home St',
            isDefault: true
        }, token);
        console.log('   Added:', addr1.data[0]?.label);

        // 4. Add Address 2
        console.log('4. Adding Work Address...');
        const addr2 = await request(`${API_URL}/address`, 'POST', {
            label: 'Work',
            addressLine: '456 Work Blvd',
            isDefault: false
        }, token);
        console.log('   Added:', addr2.data[1]?.label);

        // 5. Get Addresses
        console.log('5. Listing Addresses...');
        const listRes = await request(`${API_URL}/address`, 'GET', null, token);
        console.log(`   Found ${listRes.data.length} addresses.`);

        // 6. Update Address
        // Find the second address (Work)
        const workAddr = listRes.data.find(a => a.label === 'Work');
        if (workAddr) {
            const addrId = workAddr._id;
            console.log(`6. Updating Address ${addrId}...`);
            await request(`${API_URL}/address/${addrId}`, 'PUT', {
                label: 'Office'
            }, token);
            console.log('   Updated label to Office');

            // 7. Delete Address
            console.log('7. Deleting Address...');
            await request(`${API_URL}/address/${addrId}`, 'DELETE', null, token);
            console.log('   Deleted.');
        } else {
            console.log('   Could not find Work address to update/delete');
        }

        console.log('--- Test Passed Successfully ---');

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testAddressBook();
