import mongoose from 'mongoose';
import 'dotenv/config';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Customer from '../src/models/Customer.js';
import Rider from '../src/models/Rider.js';
import Review from '../src/models/Review.js';

async function fixUrls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const currentCloudName = process.env.CLOUDINARY_CLOUD_NAME;
        if (!currentCloudName) {
            console.error('CLOUDINARY_CLOUD_NAME not found in .env');
            process.exit(1);
        }

        console.log(`Target Cloud Name: ${currentCloudName}`);

        const collections = [
            { model: Product, field: 'image', name: 'Products' },
            { model: Category, field: 'icon', name: 'Categories' },
            { model: Customer, field: 'profileImage', name: 'Customers' },
            { model: Rider, field: 'licensePhoto', name: 'Rider License' },
            { model: Rider, field: 'aadharPhoto', name: 'Rider Aadhar' },
            { model: Rider, field: 'panPhoto', name: 'Rider PAN' },
            { model: Review, field: 'images', name: 'Reviews', isArray: true }
        ];

        for (const item of collections) {
            const query = {};
            query[item.field] = { $regex: /res\.cloudinary\.com/ };
            
            const docs = await item.model.find(query);
            console.log(`Checking ${docs.length} documents in ${item.name}...`);

            let updatedCount = 0;
            for (const doc of docs) {
                const oldVal = doc[item.field];
                let newVal;

                if (item.isArray) {
                    newVal = oldVal.map(url => url.replace(/(res\.cloudinary\.com\/)[^/]+(\/image\/upload)/, `$1${currentCloudName}$2`));
                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        doc[item.field] = newVal;
                        await doc.save();
                        updatedCount++;
                    }
                } else {
                    newVal = oldVal.replace(/(res\.cloudinary\.com\/)[^/]+(\/image\/upload)/, `$1${currentCloudName}$2`);
                    if (oldVal !== newVal) {
                        doc[item.field] = newVal;
                        await doc.save();
                        updatedCount++;
                    }
                }
            }
            console.log(`Updated ${updatedCount} ${item.name}`);
        }

        console.log('Cleanup complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixUrls();
