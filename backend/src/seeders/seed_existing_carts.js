import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Cart from '../models/Cart.js';

dotenv.config();

const seedExistingData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding existing customers...');

        // 1. Get or Create a Category
        let category = await Category.findOne();
        if (!category) {
            category = await Category.create({
                name: 'Beverages',
                description: 'Hot and cold drinks',
                image: 'bev.jpg'
            });
        }

        // 2. Get existing products
        let products = await Product.find().limit(5);
        if (products.length === 0) {
            console.log('No products found, creating some...');
            const productData = [
                { name: 'Masala Chai', description: 'Tea', price: 45, category: category._id },
                { name: 'Cold Coffee', description: 'Coffee', price: 120, category: category._id },
                { name: 'Green Tea', description: 'Tea', price: 60, category: category._id }
            ];
            products = await Product.insertMany(productData);
        }

        // 3. Get ALL existing customers
        const customers = await User.find({ role: 'customer' });
        console.log(`Found ${customers.length} existing customers.`);

        if (customers.length === 0) {
            console.log('No customers found in database. Please create some customers first.');
            process.exit(0);
        }

        // 4. Create/Update Carts for existing customers
        const now = new Date();
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));

        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];

            // Delete existing cart to avoid unique constraint if we use upsert/new
            await Cart.deleteOne({ userId: customer._id });

            let items = [];
            let updatedAt = now;

            // Simple distribution logic based on index
            if (i % 3 === 0) {
                // Active Cart
                items = [
                    { product: products[0]._id, name: products[0].name, quantity: 1, price: products[0].price },
                    { product: products[1] ? (products[1]._id) : (products[0]._id), name: products[1] ? products[1].name : products[0].name, quantity: 2, price: products[1] ? products[1].price : products[0].price }
                ];
                updatedAt = now;
            } else if (i % 3 === 1) {
                // Abandoned Cart
                items = [
                    { product: products[products.length - 1]._id, name: products[products.length - 1].name, quantity: 1, price: products[products.length - 1].price }
                ];
                updatedAt = fifteenDaysAgo;
            } else {
                // Empty Cart
                items = [];
                updatedAt = now;
            }

            const cart = new Cart({
                userId: customer._id,
                items,
                updatedAt,
                createdAt: fifteenDaysAgo
            });

            cart.subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            await cart.save();

            // Critical: Force updatedAt back to the past for abandoned carts
            await Cart.findByIdAndUpdate(cart._id, { updatedAt: updatedAt }, { timestamps: false });

            console.log(`Updated cart for ${customer.name || customer.mobile} - Status: ${items.length > 0 ? (updatedAt === now ? 'Active' : 'Abandoned') : 'Empty'}`);
        }

        console.log(`Successfully seeded carts for ${customers.length} existing customers!`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedExistingData();
