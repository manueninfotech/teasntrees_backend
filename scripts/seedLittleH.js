import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const categoriesData = [
    {
        name: 'Signature Cakes',
        description: 'Our signature creations',
        products: [
            { name: 'Red Velvet', description: 'A vibrant red velvet sponge layered with luxuriously smooth cream cheese frosting—rich, soft, and irresistibly indulgent.', price: 1800, customisationPrice: 2100 },
            { name: 'Carrot Cake', description: 'A soft carrot cake sponge infused with aromatic cinnamon, topped with silky cream cheese frosting, and delicately garnished with handcrafted sugar carrots.', price: 1800 },
            { name: 'Classic Opera', description: 'A French classic featuring delicate layers of rich almond sponge, soaked in coffee syrup and layered with velvety coffee buttercream and smooth chocolate ganache.', price: 2000 },
            { name: 'Russian Medovik', description: 'A traditional Russian honey cake, delicately soaked in honey and caramel, then layered with a rich cream cheese filling for a perfectly balanced, melt-in-your-mouth dessert.', price: 2000 },
            { name: 'Choco Fudge', description: 'A rich and moist chocolate fudge cake, lighter than traditional mud cake but packed with deep chocolate flavor. Made with both melted chocolate and cocoa, and finished with a smooth chocolate ganache to satisfy any chocolate craving.', price: 2000 },
            { name: 'Tiramisu', description: 'An Italian classic—light vanilla biscuits gently soaked in coffee liqueur, layered with silky mascarpone cream, and elegantly finished with a dusting of fine cocoa powder.', price: 2000 },
            { name: 'Tres Leches', description: 'A classic Latin American dessert featuring a light sponge cake soaked in a luscious blend of three milks—whole milk, condensed milk, and evaporated milk—topped with fluffy whipped cream for a rich and tender finish.', price: 2000 },
            { name: 'Coffee Hazelnut', description: 'A delightful cake combining the bold aroma of coffee with the rich, nutty flavor of toasted hazelnuts, layered with smooth coffee-infused cream for a perfectly balanced and indulgent treat.', price: 2000, customisationPrice: 2300 },
            { name: 'Exotica Fruit Cake', description: 'A moist cake bursting with a vibrant mix of exotic fruits, offering a unique blend of sweet and tangy flavors in every bite.', price: 2600 },
            { name: 'Rainbow Cake', description: 'An all-time kids’ favorite—fun, colorful layers of soft vanilla sponge paired with your choice of vanilla buttercream or cream cheese frosting, topped with cheerful sugar sprinkles.', price: 1800, customisationPrice: 2100 },
        ]
    },
    {
        name: 'Chocolate Cakes',
        description: 'Rich and decadent chocolate cakes',
        products: [
            { name: 'Rich Chocolate', description: 'A decadently rich chocolate cake layered with silky smooth chocolate ganache—an irresistible favorite that delights every chocolate lover.', price: 2100, customisationPrice: 2400 },
            { name: 'French Biscuit', description: 'A rich, gooey chocolate ganache layered with crunchy French biscuits and praline, topped with a glossy chocolate glaze.', price: 2300, customisationPrice: 2600 },
            { name: 'Caramel Hazelnut', description: 'A rich fudge chocolate sponge layered with salted caramel and roasted hazelnuts, finished with a delicate caramel garnish for the perfect sweet-salty indulgence.', price: 2100, customisationPrice: 2400 },
            { name: 'Chocolate Caramel', description: 'A decadent chocolate cake layered with luscious caramel and rich chocolate ganache, offering the perfect balance of deep cocoa flavor and sweet, buttery caramel.', price: 2100, customisationPrice: 2400 },
            { name: 'Ferrero Rocher', description: 'Smooth dark chocolate sponge layered with rich Nutella and Ferrero Rocher, finished with a luxurious Ferrero Rocher garnish.', price: 2100, customisationPrice: 2400 },
            { name: 'Coffee Caramel', description: 'Dark chocolate sponge soaked in espresso syrup, layered with rich caramel and silky chocolate ganache for a bold and indulgent flavor experience.', price: 2100, customisationPrice: 2400 },
            { name: 'Nutella Hazelnut', description: 'A moist chocolate sponge layered with creamy Nutella and roasted hazelnuts, offering a perfect blend of smooth, nutty richness in every bite.', price: 2300, customisationPrice: 2600 },
            { name: 'Chocolate Hazelnut', description: 'Rich chocolate sponge layered with smooth hazelnut cream and roasted hazelnuts, creating a luxurious blend of deep cocoa and nutty sweetness.', price: 2600, customisationPrice: 2900 },
        ]
    },
    {
        name: 'Cream Cakes',
        description: 'Light and creamy cakes',
        products: [
            { name: 'Custard Blueberry', description: 'Soft vanilla sponge layered with smooth custard cream and sweet-tart blueberry jam filling.', price: 1600, customisationPrice: 2000 },
            { name: 'Seasonal Fruit', description: 'Vanilla sponge soaked in sugar syrup, layered with vanilla whipped cream and seasonal fruits.', price: 2500, customisationPrice: 2800 },
            { name: 'Chocolate Mousse Cake', description: 'A very delicious mousse cake with dark chocolate sponge filled with dark chocolate mousse and topped with silky dark chocolate ganache.', price: 2000 },
            { name: 'Biscoff Cake', description: 'Vanilla sponge layered with creamy Biscoff spread and whipped Biscoff frosting, topped with crushed Biscoff cookies for the perfect spiced crunch.', price: 2300, customisationPrice: 2600 },
        ]
    },
    {
        name: 'Cheese Cakes',
        description: 'Smooth and rich cheese cakes',
        products: [
            { name: 'Blueberry Cheese Cake', description: 'Creamy cheesecake topped with a vibrant blueberry compote, blending rich, smooth textures with a burst of fresh, fruity sweetness.', price: 2500 },
            { name: 'Biscoff Cheese Cake', description: 'Creamy cheesecake with Biscoff spread and a crunchy cookie crumble.', price: 2500 },
            { name: 'Burnt Basque Cheesecake', description: 'A rich, creamy, and irresistibly smooth cheesecake with a caramelized burnt top that gives it a deep, toasty flavor.', price: 2300 }
        ]
    },
    {
        name: 'Everyday Cakes',
        description: 'Perfect for every day',
        products: [
            { name: 'Vanilla Cake', description: 'A soft vanilla sponge layered with creamy custard blended into light whipped cream, offering a rich and velvety texture.', price: 1200, customisationPrice: 1600 },
            { name: 'Butterscotch', description: 'A moist cake layered and topped with luscious, buttery butterscotch cream, delivering a sweet, caramelized flavor that melts in your mouth.', price: 1400, customisationPrice: 1800 },
            { name: 'White Forest Cake', description: 'Light, fluffy layers of vanilla sponge cake paired with fresh cream and juicy cherries, creating a delicate and refreshing dessert with a touch of sweetness.', price: 1400, customisationPrice: 1800 },
            { name: 'Pineapple Cake', description: 'A light and moist cake bursting with the sweet, tangy flavor of ripe pineapple, layered and topped with creamy frosting for a tropical delight in every bite.', price: 1400, customisationPrice: 1800 },
            { name: 'Black Forest Cake', description: 'A timeless indulgence featuring layers of rich chocolate sponge, luscious whipped cream, and juicy cherries, crowned with chocolate shavings for a perfect harmony of flavors.', price: 1400, customisationPrice: 1800 },
            { name: 'Strawberry Cake', description: 'A delicate vanilla sponge layered with luscious strawberry pulp and smooth custard cream blended into whipped cream, delivering a rich yet refreshing strawberry delight.', price: 1400, customisationPrice: 1800 },
            { name: 'Honey Almond', description: 'A moist cake infused with natural honey and layered with toasted almond cream, delivering a harmonious blend of sweet and nutty flavors.', price: 1500, customisationPrice: 1900 },
        ]
    },
    {
        name: 'PANCAKES',
        description: 'Delicious hot pancakes',
        products: [
            { name: 'Berry Bliss', description: 'Berry Bliss Pancake', price: 199 },
            { name: 'Nutella Heaven', description: 'Nutella Heaven Pancake', price: 199 },
            { name: 'Apple Pie Pancake', description: 'Apple Pie Pancake', price: 199 },
            { name: 'Chocolate Crunch', description: 'Chocolate Crunch Pancake', price: 199 },
        ]
    },
    {
        name: 'TOASTS',
        description: 'Crispy toasts',
        products: [
            { name: 'Berry Delight', description: 'Berry Delight Toast', price: 199 },
            { name: 'Banoffee Toast', description: 'Banoffee Toast', price: 199 },
            { name: 'Breakfast Boost', description: 'Breakfast Boost Toast', price: 199 },
            { name: 'Classic Maple', description: 'Classic Maple Toast', price: 199 },
        ]
    },
    {
        name: 'PAN PIZZAS',
        description: 'Delicious Pan Pizzas',
        products: [
            { name: 'Garden Fresh Delight', description: 'Garden Fresh Delight Pizza', price: 209 },
            { name: 'Country Feast', description: 'Country Feast Pizza', price: 209 },
            { name: 'Piri Piri Chicken Pizza', description: 'Piri Piri Chicken Pizza', price: 249 },
            { name: 'Mexican Chicken Pizza', description: 'Mexican Chicken Pizza', price: 249 },
            { name: 'Spicy Garlic Prawn Pizza', description: 'Spicy Garlic Prawn Pizza', price: 299 },
        ]
    },
    {
        name: 'SANDWICHES',
        description: 'Fresh Sandwiches',
        products: [
            { name: 'Spinach Mushroom Sandwich', description: 'Spinach Mushroom Sandwich', price: 199 },
            { name: 'Schezwan Cheese Chilli Sandwhich', description: 'Schezwan Cheese Chilli Sandwhich', price: 219 },
            { name: 'Smoked Chicken Tikka Sandwich', description: 'Smoked Chicken Tikka Sandwich', price: 249 },
            { name: 'Panner Tikka Sandwich', description: 'Panner Tikka Sandwich', price: 249 },
        ]
    },
    {
        name: 'VEG SNACKS',
        description: 'Vegetarian snacks',
        products: [
            { name: 'French Fries', description: 'French Fries', price: 149 },
            { name: 'Kungfu Fries', description: 'Kungfu Fries', price: 189 },
            { name: 'Cheese Burst Croquettes', description: 'Cheese Burst Croquettes', price: 249 },
            { name: 'Paneer Croquettes', description: 'Paneer Croquettes', price: 249 },
        ]
    },
    {
        name: 'NON VEG SNACKS',
        description: 'Non-vegetarian snacks',
        products: [
            { name: 'Spicy chilli chicken', description: 'Spicy chilli chicken', price: 299 },
            { name: 'Buffalo Wings', description: 'Buffalo Wings', price: 349 },
            { name: 'Korean Fried Wings', description: 'Korean Fried Wings', price: 349 },
            { name: 'Chicken Chips', description: 'Chicken Chips', price: 349 },
            { name: 'Fish and chips', description: 'Fish and chips', price: 349 },
            { name: 'Crispy fish cakes', description: 'Crispy fish cakes', price: 349 },
            { name: 'Prawn & Cheese Croquettes', description: 'Prawn & Cheese Croquettes', price: 349 },
            { name: 'Peri-Peri Fried Prawns', description: 'Peri-Peri Fried Prawns', price: 399 },
        ]
    },
    {
        name: 'PASTAS',
        description: 'Delicious Pastas',
        products: [
            { name: 'Creamy Mushroom Brocolli Alfredo', description: 'Creamy Mushroom Brocolli Alfredo', price: 299 },
            { name: 'Paneer & Spinach Alfredo', description: 'Paneer & Spinach Alfredo', price: 299 },
            { name: 'Sundried Pink Delight', description: 'Sundried Pink Delight', price: 349 },
            { name: 'Creamy Mushroom Chicken Alfredo', description: 'Creamy Mushroom Chicken Alfredo', price: 349 },
            { name: 'Spicy Chicken Arrabiata', description: 'Spicy Chicken Arrabiata', price: 349 },
            { name: 'Rosé Butter Prawns', description: 'Rosé Butter Prawns', price: 349 },
        ]
    }
];

const seedLittleh = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        let displayOrder = 1;

        for (const catData of categoriesData) {
            let category = await Category.findOne({ name: catData.name, brand: 'littleh' });

            if (!category) {
                category = await Category.create({
                    name: catData.name,
                    brand: 'littleh',
                    description: catData.description,
                    displayOrder: displayOrder++
                });
                console.log(`Created category: ${catData.name}`);
            }

            for (const prodData of catData.products) {
                const existingProduct = await Product.findOne({ name: prodData.name, brand: 'littleh' });

                if (!existingProduct) {
                    const variants = [];
                    if (prodData.customisationPrice) {
                        variants.push({ name: 'Regular Customised', price: prodData.customisationPrice });
                    }

                    // Add eggless variants if it's a cake
                    if (['Signature Cakes', 'Chocolate Cakes', 'Cream Cakes', 'Everyday Cakes'].includes(catData.name)) {
                        variants.push({ name: 'Eggless', price: prodData.price + 100 });
                        if (prodData.customisationPrice) {
                            variants.push({ name: 'Eggless Customised', price: prodData.customisationPrice + 100 });
                        }
                    }

                    await Product.create({
                        name: prodData.name,
                        description: prodData.description,
                        brand: 'littleh',
                        category: category._id,
                        price: prodData.price,
                        variants: variants.length > 0 ? variants : undefined,
                        isAvailable: true
                    });
                    console.log(`  -> Created product: ${prodData.name}`);
                }
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedLittleh();
