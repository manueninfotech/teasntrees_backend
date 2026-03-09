import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/test_performance_db';

async function verifyLocalData() {
    try {
        console.log('Connecting to local MongoDB for verification...');
        const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('Connected.');

        const collections = await conn.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections locally.`);

        for (const col of ['products', 'orders', 'categories', 'contacts', 'reviews']) {
            const count = await conn.db.collection(col).countDocuments();
            console.log(`- ${col}: ${count} documents`);
        }

        await conn.close();
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        process.exit(0);
    }
}

verifyLocalData();
