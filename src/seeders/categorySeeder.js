import mongoose from 'mongoose';
import Category from '../models/Category.js';
import dotenv from 'dotenv';
dotenv.config();

const categories = [
    // Hot Beverages
    { name: 'Hot Coffees & Hot Milk', description: 'Hot coffee and milk varieties', icon: '☕', displayOrder: 1 },
    { name: 'Clear Teas', description: 'Hot clear tea varieties', icon: '🍵', displayOrder: 2 },

    // Cold Beverages
    { name: 'Cold Coffee', description: 'Iced and cold coffee drinks', icon: '🧋', displayOrder: 3 },
    { name: 'Cold Clear Teas', description: 'Iced tea varieties', icon: '🍹', displayOrder: 4 },
    { name: 'Shakes', description: 'Milkshakes and smoothies', icon: '🥤', displayOrder: 5 },
    { name: 'Milk Shakes & Thick Shakes', description: 'Milk shakes and thick shakes', icon: '🥤', displayOrder: 6 },
    { name: 'Mojitos', description: 'Refreshing mojitos', icon: '🍸', displayOrder: 6 },
    { name: 'Real Fruit Mojitos', description: 'Fresh fruit mojitos', icon: '🍓', displayOrder: 7 },
    { name: 'Almond Gum Special', description: 'Special almond gum drinks', icon: '🥛', displayOrder: 8 },
    { name: 'Chaas/Lassi', description: 'Traditional chaas and lassi drinks', icon: '🥛', displayOrder: 9 },
    { name: 'Real Root & Fruit Thick Milk', description: 'Thick milk blended with real roots and fruits', icon: '🥛', displayOrder: 10 },
    { name: 'Cold Pressed Juices', description: 'Fresh cold pressed juices', icon: '🧃', displayOrder: 11 },
    { name: 'Iced Coffee', description: 'Refreshing iced coffee drinks', icon: '🧊', displayOrder: 12 },

    // Desserts & Sweets
    { name: 'Smoothie Bowls', description: 'Healthy and delicious smoothie bowls', icon: '🥣', displayOrder: 11 },
    { name: 'Fruit Salad Bowl', description: 'Fresh fruit salad bowls', icon: '🍇', displayOrder: 12 },
    { name: 'Desserts', description: 'Sweet desserts', icon: '🍰', displayOrder: 12 },
    { name: 'Ice Cream Scoops', description: 'Ice cream varieties', icon: '🍦', displayOrder: 13 },
    { name: 'Falooda', description: 'Rich and creamy falooda', icon: '🍨', displayOrder: 13 },

    // Soups & Salads
    { name: 'Soups', description: 'Hot soups', icon: '🍲', displayOrder: 14 },
    { name: 'Salads', description: 'Fresh salads', icon: '🥗', displayOrder: 15 },

    // Starters & Snacks
    { name: 'Garlic Breads and Toasts', description: 'Garlic bread varieties', icon: '🍞', displayOrder: 16 },
    { name: 'Deep Fries', description: 'Deep fried items', icon: '🍟', displayOrder: 17 },
    { name: 'Potato Snacks', description: 'Potato-based snacks', icon: '🥔', displayOrder: 18 },
    { name: 'Crispy Bites', description: 'Crispy snacks', icon: '🍗', displayOrder: 19 },
    { name: 'Tachos and Nachos', description: 'Tachos and nachos', icon: '🌮', displayOrder: 20 },
    { name: 'Tandoori', description: 'Tandoori items', icon: '🍢', displayOrder: 21 },
    { name: 'Momos', description: 'Steamed and fried momos', icon: '🥟', displayOrder: 22 },

    // Main Course
    { name: 'Wraps', description: 'Various wraps', icon: '🌯', displayOrder: 23 },
    { name: 'Sandwich', description: 'Sandwich varieties', icon: '🥪', displayOrder: 24 },
    { name: 'Maggi', description: 'Maggi noodles', icon: '🍜', displayOrder: 25 },
    { name: 'Burgers', description: 'Burger varieties', icon: '🍔', displayOrder: 26 },
    { name: 'Pasta', description: 'Pasta dishes', icon: '🍝', displayOrder: 27 },
    { name: 'Pizza', description: 'Pizza varieties', icon: '🍕', displayOrder: 28 },
    { name: 'Millet Kitchidi', description: 'Healthy millet kitchidi', icon: '🌾', displayOrder: 29 },
    { name: 'Curry Rice Bowls', description: 'Rice bowls with curry', icon: '🍛', displayOrder: 30 },
    { name: 'Rice Bowls', description: 'Various rice bowls', icon: '🍚', displayOrder: 31 },
    { name: 'Sizzlers', description: 'Sizzler platters', icon: '🔥', displayOrder: 32 },
    { name: 'Omlettes', description: 'Omelette varieties', icon: '🍳', displayOrder: 33 }
];

const seedCategories = async () => {
    try {
        console.log('Starting category seeding...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories\n');

        // Insert new categories
        const result = await Category.insertMany(categories);
        console.log(`Seeded ${result.length} categories\n`);

        console.log('Categories by group:');
        console.log('\nHot Beverages:');
        result.filter(c => c.displayOrder <= 2).forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name}`);
        });

        console.log('\nCold Beverages:');
        result.filter(c => c.displayOrder >= 3 && c.displayOrder <= 10).forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name}`);
        });

        console.log('\nDesserts & Sweets:');
        result.filter(c => c.displayOrder >= 11 && c.displayOrder <= 13).forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name}`);
        });

        console.log('\nSoups & Salads:');
        result.filter(c => c.displayOrder >= 14 && c.displayOrder <= 15).forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name}`);
        });

        console.log('\nStarters & Snacks:');
        result.filter(c => c.displayOrder >= 16 && c.displayOrder <= 22).forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name}`);
        });

        console.log('\nMain Course:');
        result.filter(c => c.displayOrder >= 23).forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name}`);
        });

        console.log('\nCategory seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
