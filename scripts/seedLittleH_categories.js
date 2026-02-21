import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../src/models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const categories = [
    { name: 'Signature Cakes', description: 'Our signature creations' },
    { name: 'Chocolate Cakes', description: 'Rich and decadent chocolate cakes' },
    { name: 'Cream Cakes', description: 'Light and creamy cakes' },
    { name: 'Cheese Cakes', description: 'Smooth and rich cheese cakes' },
    { name: 'Everyday Cakes', description: 'Perfect for every day' },
    { name: 'PANCAKES', description: 'Delicious hot pancakes' },
    { name: 'TOASTS', description: 'Crispy toasts' },
    { name: 'PAN PIZZAS', description: 'Delicious Pan Pizzas' },
    { name: 'SANDWICHES', description: 'Fresh Sandwiches' },
    { name: 'VEG SNACKS', description: 'Vegetarian snacks' },
    { name: 'NON VEG SNACKS', description: 'Non-vegetarian snacks' },
    { name: 'PASTAS', description: 'Delicious Pastas' }
];

const seedCategories = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        let displayOrder = 1;

        for (const cat of categories) {
            const existing = await Category.findOne({ name: cat.name, brand: 'littleh' });
            if (!existing) {
                await Category.create({
                    name: cat.name,
                    brand: 'littleh',
                    description: cat.description,
                    displayOrder: displayOrder++
                });
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category already exists: ${cat.name}`);
            }
        }

        console.log('Categories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
