const io = require('../../backend/node_modules/socket.io-client');
const { testAdminAuth } = require('./test-auth');

const SIO_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/admin';

async function testSocket() {
    console.log('--- Starting Socket.io Verification Test ---');

    let adminToken, socket, customerSocket;

    try {
        // 1. Get Authentication
        console.log('1. Authenticating Admin...');
        adminToken = await testAdminAuth();
        if (!adminToken) throw new Error('Admin login failed');

        // 2. Connect Admin Socket
        console.log('2. Connecting Admin Socket...');
        socket = io(SIO_URL, {
            auth: { token: adminToken },
            transports: ['websocket']
        });

        const socketConnectPromise = new Promise((resolve, reject) => {
            socket.on('connect', () => {
                console.log('   Admin Socket Connected:', socket.id);
                resolve();
            });
            socket.on('connect_error', (err) => reject('Connection Failed: ' + err.message));
        });

        await socketConnectPromise;

        // 3. Setup Logic to Listen for 'category:created'
        const eventPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject('Timeout waiting for event'), 5000);

            socket.on('category:created', (data) => {
                clearTimeout(timeout);
                console.log('   EVENT RECEIVED: category:created');
                console.log('   Data:', data);
                resolve(data);
            });
        });

        // 4. Trigger Event via API (Create Category)
        console.log('3. Triggering Event (Creating Category)...');
        const catName = 'Socket Test ' + Date.now();
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: catName,
                description: 'Testing sockets'
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error('API Request Failed: ' + text);
        }

        const catData = await res.json();
        console.log('   Category Created via API:', catData.data.name);

        // 5. Wait for Event
        console.log('4. Waiting for Socket Event...');
        await eventPromise;
        console.log('   Success! Real-time event received.');

        // Cleanup: Delete the category
        await fetch(`${API_URL}/categories/${catData.data._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('   Cleanup: Test category deleted.');

        console.log('--- Socket.io Test Passed ---');

    } catch (error) {
        console.error('Test Failed:', error.message || error);
    } finally {
        if (socket) socket.close();
        if (customerSocket) customerSocket.close();
    }
}

if (require.main === module) {
    testSocket();
}

module.exports = { testSocket };
