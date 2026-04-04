import mongoose from 'mongoose';

const REMOTE_URI = 'mongodb+srv://shravyavenishetty03:Shravya123@cluster0.ix2iee1.mongodb.net/test_performance_db?retryWrites=true&w=majority';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/test_performance_db';

async function cloneDatabase() {
    let remoteConn, localConn;
    try {
        console.log('Connecting to remote MongoDB...');
        remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();
        console.log('Connected to remote MongoDB.');

        console.log('Connecting to local MongoDB...');
        localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('Connected to local MongoDB.');

        const collections = await remoteConn.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections.`);

        for (const collectionDef of collections) {
            const collectionName = collectionDef.name;
            console.log(`Cloning collection: ${collectionName}...`);

            const remoteCollection = remoteConn.db.collection(collectionName);
            const localCollection = localConn.db.collection(collectionName);

            // Clear local collection first
            await localCollection.deleteMany({});

            const data = await remoteCollection.find({}).toArray();
            if (data.length > 0) {
                await localCollection.insertMany(data);
                console.log(`  - Cloned ${data.length} documents.`);
            } else {
                console.log(`  - Collection is empty.`);
            }
        }

        console.log('Database cloning completed successfully!');
    } catch (error) {
        console.error('Error cloning database:', error);
    } finally {
        if (remoteConn) await remoteConn.close();
        if (localConn) await localConn.close();
        process.exit(0);
    }
}

cloneDatabase();
