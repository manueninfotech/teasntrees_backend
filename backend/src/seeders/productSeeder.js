import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const seedProducts = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');

        console.log('Fetching categories...');
        const categories = await Category.find();
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        console.log('Clearing existing products...');
        await Product.deleteMany({});

        const products = [
            // 🥣 SOUPS
            { name: 'Lemon Corriander Soup', price: 149, description: 'A tangy and refreshing soup with fresh coriander and lemon flavor.', category: categoryMap['Soups'], tags: ['must-try'] },
            { name: 'Hot and Sour Soup', price: 149, description: 'A spicy and tangy Indo-Chinese soup with vegetables.', category: categoryMap['Soups'], tags: ['best-seller'] },
            { name: 'Creamy Roasted Tomato Basil Soup', price: 159, description: 'A smooth and creamy soup with roasted tomatoes and fresh basil.', category: categoryMap['Soups'], tags: ['new-intro'] },
            { name: 'Carrot Pumpkin Soup', price: 159, description: 'A healthy and hearty soup made with carrots and pumpkin.', category: categoryMap['Soups'], tags: [] },
            { name: 'Creamy Mushroom Soup', price: 169, description: 'A rich and velvety mushroom soup with cream.', category: categoryMap['Soups'], tags: ['new-intro'] },
            { name: 'Broccoli Almond Soup', price: 169, description: 'A nutritious soup with broccoli and almonds.', category: categoryMap['Soups'], tags: ['new-intro'] },
            { name: 'Manchow Soup', price: 169, description: 'A thick and flavorful Indo-Chinese soup with crispy noodles on top.', category: categoryMap['Soups'], tags: [] },

            // 🥗 SALADS
            { name: 'Italian Salad (Mayo Dressing)', price: 199, description: 'A fresh Italian salad with mayo dressing.', category: categoryMap['Salads'], tags: ['best-seller'] },
            { name: 'Caeser Salad (Ceaser Dressing)', price: 249, description: 'Classic Caesar salad with Caesar dressing and croutons.', category: categoryMap['Salads'], tags: ['new-intro'] },
            { name: 'Russian Salad (Mayo Dressing)', price: 249, description: 'A creamy Russian salad with mixed vegetables and mayo.', category: categoryMap['Salads'], tags: ['new-intro'] },
            { name: 'Greek Salad (Simple Salad Dressing)', price: 249, description: 'A Mediterranean salad with feta cheese and olives.', category: categoryMap['Salads'], tags: ['new-intro'] },
            { name: 'Quinoa Salad (Simple Salad Dressing)', price: 249, description: 'A healthy quinoa salad with vegetables and light dressing.', category: categoryMap['Salads'], tags: ['new-intro'] },
            { name: 'Buddha Bowl - Veg or Egg', price: 349, description: 'A wholesome bowl with grains, vegetables, and your choice of veg or egg.', category: categoryMap['Salads'], tags: ['new-intro'] },

            // 🥖 GARLIC BREADS AND TOASTS
            { name: 'Plain Garlic Bread', price: 99, description: 'Toasted bread with garlic butter and herbs.', category: categoryMap['Garlic Breads and Toasts'], tags: [] },
            { name: 'Cheese Garlic Bread', price: 119, description: 'Garlic bread topped with melted cheese.', category: categoryMap['Garlic Breads and Toasts'], tags: [] },
            { name: 'Masala Garlic Bread', price: 129, description: 'Garlic bread with spicy Indian masala topping.', category: categoryMap['Garlic Breads and Toasts'], tags: ['best-seller'] },
            { name: 'Avacado Toast', price: 199, description: 'Toasted bread topped with fresh avocado and seasonings.', category: categoryMap['Garlic Breads and Toasts'], tags: ['new-intro'] },
            { name: 'Scrambled Egg Toast', price: 199, description: 'Toast topped with creamy scrambled eggs.', category: categoryMap['Garlic Breads and Toasts'], tags: ['new-intro', 'egg-contains'] },

            // 🍟 DEEP FRIES
            { name: 'Crispy Corn', price: 169, description: 'Crispy fried corn kernels with spices.', category: categoryMap['Deep Fries'], tags: ['best-seller'] },
            { name: 'Onion Rings', price: 169, description: 'Golden fried onion rings with a crispy coating.', category: categoryMap['Deep Fries'], tags: [] },
            { name: 'Baby Corn Sticks', price: 169, description: 'Crispy baby corn sticks, perfect for snacking.', category: categoryMap['Deep Fries'], tags: [] },
            { name: 'Cheese Corn Balls', price: 199, description: 'Deep-fried corn and cheese balls, crispy on the outside.', category: categoryMap['Deep Fries'], tags: ['best-seller'] },
            { name: 'Mushroom Croquettes', price: 199, description: 'Crispy mushroom croquettes with a creamy filling.', category: categoryMap['Deep Fries'], tags: ['new-intro'] },
            { name: 'Panner Croquettes', price: 199, description: 'Paneer-filled croquettes, fried to golden perfection.', category: categoryMap['Deep Fries'], tags: ['new-intro'] },
            { name: 'Panner Pops', price: 249, description: 'Bite-sized paneer pops with a spicy coating.', category: categoryMap['Deep Fries'], tags: ['must-try'] },

            // 🥔 POTATO SNACKS
            { name: 'French Fries', price: 149, description: 'Classic crispy golden french fries.', category: categoryMap['Potato Snacks'], tags: ['best-seller'] },
            { name: 'Thin Fries', price: 149, description: 'Extra thin and crispy french fries.', category: categoryMap['Potato Snacks'], tags: [] },
            { name: 'French Fries Chat', price: 159, description: 'French fries topped with chaat masala and chutneys.', category: categoryMap['Potato Snacks'], tags: [] },
            { name: 'Peri Peri French Fries', price: 179, description: 'Fries tossed in spicy Peri Peri seasoning.', category: categoryMap['Potato Snacks'], tags: ['best-seller'] },
            { name: 'V Crispers', price: 199, description: 'Crispy potato crispers with a special coating.', category: categoryMap['Potato Snacks'], tags: [] },
            { name: 'KungFu Fries', price: 199, description: 'Asian-inspired seasoned fries with a kick.', category: categoryMap['Potato Snacks'], tags: ['new-intro'] },
            { name: 'Special Potato Wedges', price: 199, description: 'Thick-cut potato wedges, seasoned and baked.', category: categoryMap['Potato Snacks'], tags: [] },
            { name: 'Cajun Spiced Potato', price: 199, description: 'Potatoes seasoned with Cajun spices.', category: categoryMap['Potato Snacks'], tags: ['must-try'] },
            { name: 'Cheese Topped French Fries', price: 249, description: 'French fries loaded with melted cheese.', category: categoryMap['Potato Snacks'], tags: [] },

            // 🔥 CRISPY BITES
            { name: 'Aloo Bites (Dry/Wet)', price: 209, description: 'Crispy potato bites available in dry or gravy style.', category: categoryMap['Crispy Bites'], tags: [] },
            { name: 'Gobi Bites (Dry/Wet)', price: 239, description: 'Crispy cauliflower bites, served dry or with sauce.', category: categoryMap['Crispy Bites'], tags: [] },
            { name: 'Baby Corn Bites (Dry/Wet)', price: 259, description: 'Crispy baby corn bites with your choice of dry or wet preparation.', category: categoryMap['Crispy Bites'], tags: [] },
            { name: 'Panner Bites (Dry/Wet)', price: 289, description: 'Crispy paneer bites, available dry or in gravy.', category: categoryMap['Crispy Bites'], tags: ['best-seller'] },
            { name: 'Broccoli Bites (Dry/Wet)', price: 289, description: 'Crispy broccoli bites with a choice of preparation style.', category: categoryMap['Crispy Bites'], tags: ['best-seller'] },
            { name: 'Mushroom Bites (Dry/Wet)', price: 289, description: 'Crispy mushroom bites, dry or with sauce.', category: categoryMap['Crispy Bites'], tags: [] },
            { name: 'Egg Bites (Dry/Wet)', price: 259, description: 'Crispy egg bites available in dry or wet style.', category: categoryMap['Crispy Bites'], tags: ['must-try', 'egg-contains'] },

            // 🌮 TACHOS & NACHOS
            { name: 'Veggie Tacos', price: 209, description: 'Crispy tacos filled with fresh vegetables.', category: categoryMap['Tachos and Nachos'], tags: [] },
            { name: 'Veggie Nachos', price: 209, description: 'Crispy nachos topped with vegetables and cheese.', category: categoryMap['Tachos and Nachos'], tags: [] },
            { name: 'Special Masala Nachos', price: 249, description: 'Nachos with special Indian masala toppings.', category: categoryMap['Tachos and Nachos'], tags: ['best-seller'] },
            { name: 'Special Masala Tacos', price: 249, description: 'Tacos with spicy masala filling.', category: categoryMap['Tachos and Nachos'], tags: [] },

            // 🔥 TANDOORI
            { name: 'Achari - Soya Chaap', price: 299, description: 'Soya chaap marinated in tangy pickle spices and grilled.', category: categoryMap['Tandoori'], tags: ['new-intro'] },
            { name: 'Achari - Panner', price: 299, description: 'Paneer marinated in tangy pickle spices and grilled.', category: categoryMap['Tandoori'], tags: ['new-intro'] },
            { name: 'Afghani - Soya Chaap', price: 299, description: 'Soya chaap in creamy Afghani marinade, tandoor-cooked.', category: categoryMap['Tandoori'], tags: ['new-intro'] },
            { name: 'Afghani - Panner', price: 299, description: 'Paneer in creamy Afghani marinade, tandoor-cooked.', category: categoryMap['Tandoori'], tags: ['new-intro'] },
            { name: 'Tandoori - Soya Chaap', price: 299, description: 'Classic tandoori soya chaap with traditional spices.', category: categoryMap['Tandoori'], tags: ['new-intro'] },
            { name: 'Tandoori - Panner', price: 299, description: 'Classic tandoori paneer with traditional spices.', category: categoryMap['Tandoori'], tags: ['new-intro'] },

            // 🥟 MOMOS
            { name: 'Veg Momo (Steamed)', price: 169, description: 'Steamed vegetable momos, light and healthy.', category: categoryMap['Momos'], tags: ['new-intro'] },
            { name: 'Veg Momo (Jhol)', price: 219, description: 'Vegetable momos in flavorful jhol sauce.', category: categoryMap['Momos'], tags: ['new-intro'] },
            { name: 'Panner Momo (Steamed)', price: 169, description: 'Steamed paneer momos with soft filling.', category: categoryMap['Momos'], tags: ['new-intro'] },
            { name: 'Panner Momo (Jhol)', price: 219, description: 'Paneer momos served in jhol sauce.', category: categoryMap['Momos'], tags: ['new-intro'] },
            { name: 'Egg Momo (Steamed)', price: 209, description: 'Steamed egg momos with savory filling.', category: categoryMap['Momos'], tags: ['new-intro', 'egg-contains'] },
            { name: 'Egg Momo (Jhol)', price: 259, description: 'Egg momos in flavorful jhol sauce.', category: categoryMap['Momos'], tags: ['new-intro', 'egg-contains'] },

            // 🍰 DESSERTS
            { name: 'Walnut Brownie', price: 119, description: 'Rich chocolate brownie with crunchy walnuts.', category: categoryMap['Desserts'], tags: [] },
            { name: 'Brownie + Vanilla Scoop', price: 169, description: 'Warm brownie served with vanilla ice cream.', category: categoryMap['Desserts'], tags: [] },
            { name: 'Brownie + Chocolate Scoop', price: 189, description: 'Warm brownie with chocolate ice cream.', category: categoryMap['Desserts'], tags: [] },
            { name: 'Sizzling Brownie With Vanilla', price: 289, description: 'Hot sizzling brownie with vanilla ice cream and chocolate sauce.', category: categoryMap['Desserts'], tags: ['best-seller'] },
            { name: 'Sizzling Brownie With Chocolate', price: 299, description: 'Hot sizzling brownie with chocolate ice cream.', category: categoryMap['Desserts'], tags: [] },
            { name: 'Cheese Kunafa', price: 349, description: 'Traditional Middle Eastern dessert with cheese and syrup.', category: categoryMap['Desserts'], tags: ['best-seller'] },
            { name: 'Chocolate Kunafa', price: 349, description: 'Kunafa with chocolate filling and sweet syrup.', category: categoryMap['Desserts'], tags: [] },
            { name: 'Dry Fruit Custurd', price: 169, description: 'Creamy custard loaded with dry fruits.', category: categoryMap['Desserts'], tags: [] },
            { name: 'Fresh Fruit Custurd', price: 149, description: 'Fresh fruit custard with seasonal fruits.', category: categoryMap['Desserts'], tags: ['must-try'] },
            { name: 'Jigarthanda - plain', price: 199, description: 'A traditional South Indian cooling dessert drink.', category: categoryMap['Desserts'], tags: ['new-intro'] },
            { name: 'Jigarthanda - dry fruit', price: 199, description: 'Jigarthanda loaded with dry fruits.', category: categoryMap['Desserts'], tags: ['new-intro'] },
            { name: 'Dry Fruit loaded Jigarthanda', price: 249, description: 'Premium Jigarthanda with extra dry fruits.', category: categoryMap['Desserts'], tags: ['new-intro'] },

            // 🍨 ICE CREAM SCOOPS
            { name: 'Vanilla Scoop', price: 69, description: 'Classic creamy vanilla ice cream scoop.', category: categoryMap['Ice Cream Scoops'], tags: ['best-seller'] },
            { name: 'Butterscotch Scoop', price: 89, description: 'Butterscotch ice cream with crunchy bits.', category: categoryMap['Ice Cream Scoops'], tags: [] },
            { name: 'Chocolate Scoop', price: 89, description: 'Rich chocolate ice cream scoop.', category: categoryMap['Ice Cream Scoops'], tags: ['must-try'] },
            { name: 'Strawberry Scoop', price: 89, description: 'Fresh strawberry-flavored ice cream.', category: categoryMap['Ice Cream Scoops'], tags: [] },
            { name: 'Dark Chocolate Scoop', price: 99, description: 'Intense dark chocolate ice cream scoop.', category: categoryMap['Ice Cream Scoops'], tags: [] },

            // ☕ HOT COFFEE
            { name: 'Classic Filter Coffee', price: 109, description: 'Traditional South Indian filter coffee.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Espresso', price: 99, description: 'Strong and bold espresso shot.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Café Americano', price: 109, description: 'Espresso diluted with hot water for a smooth taste.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Affogato', price: 139, description: 'Vanilla ice cream drowned in a shot of hot espresso.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Caffe Latte', price: 129, description: 'Espresso with steamed milk and a light foam.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Cappuccino', price: 129, description: 'Espresso with steamed milk and thick milk foam.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Hot Chocolate', price: 159, description: 'Rich and creamy hot chocolate drink.', category: categoryMap['Hot Coffee'], tags: ['best-seller'] },
            { name: 'Hot Nutella', price: 199, description: 'Decadent hot Nutella drink with milk.', category: categoryMap['Hot Coffee'], tags: ['must-try'] },
            { name: 'Café Mocha', price: 179, description: 'Espresso with chocolate and steamed milk.', category: categoryMap['Hot Coffee'], tags: [] },
            { name: 'Nutella Café Mocha', price: 229, description: 'Café mocha with Nutella for extra richness.', category: categoryMap['Hot Coffee'], tags: [] },

            // 🧊 COLD COFFEE
            { name: 'Tnt Frappe', price: 199, description: 'Signature Teas N Trees frappe, cold and refreshing.', category: categoryMap['Cold Coffee'], tags: ['best-seller'] },
            { name: 'Caramel Frappe', price: 249, description: 'Iced coffee frappe with caramel flavor.', category: categoryMap['Cold Coffee'], tags: [] },
            { name: 'Choco Frappe', price: 249, description: 'Chocolate-flavored cold coffee frappe.', category: categoryMap['Cold Coffee'], tags: [] },
            { name: 'Cookie Frappe', price: 249, description: 'Frappe with crushed cookies blended in.', category: categoryMap['Cold Coffee'], tags: [] },
            { name: 'Brownie Frappe', price: 289, description: 'Cold frappe with brownie chunks.', category: categoryMap['Cold Coffee'], tags: ['must-try'] },

            // 🍵 CLEAR TEAS
            { name: 'Hibiscus Tea', price: 99, description: 'Refreshing herbal tea with hibiscus flowers.', category: categoryMap['Clear Teas'], tags: ['best-seller'] },
            { name: 'Honey Lemon Tea', price: 89, description: 'Soothing tea with honey and lemon.', category: categoryMap['Clear Teas'], tags: [] },
            { name: 'Detox Tea', price: 99, description: 'Herbal detox tea to cleanse and refresh.', category: categoryMap['Clear Teas'], tags: ['must-try'] },
            { name: 'Tulasi Sleep Tea', price: 99, description: 'Calming tulsi tea for relaxation.', category: categoryMap['Clear Teas'], tags: ['best-seller'] },
            { name: 'Mint Chamomile Tea', price: 99, description: 'Soothing mint and chamomile tea blend.', category: categoryMap['Clear Teas'], tags: ['new-intro'] },
            { name: 'Cinnamon Orange', price: 109, description: 'Warm tea with cinnamon and orange flavors.', category: categoryMap['Clear Teas'], tags: ['new-intro'] },
            { name: 'Cinnamon Ashwagandha', price: 109, description: 'Herbal tea with cinnamon and ashwagandha.', category: categoryMap['Clear Teas'], tags: ['new-intro'] },
            { name: 'Roots Tea', price: 109, description: 'Traditional herbal roots tea.', category: categoryMap['Clear Teas'], tags: ['new-intro'] },
            { name: 'Slimming Tea', price: 109, description: 'Herbal tea blend for weight management.', category: categoryMap['Clear Teas'], tags: ['new-intro'] },
            { name: 'Krishna Tulsi Tea', price: 109, description: 'Pure Krishna tulsi herbal tea.', category: categoryMap['Clear Teas'], tags: ['new-intro'] },
            { name: 'Flora Tea', price: 599, description: 'Premium floral tea blend.', category: categoryMap['Clear Teas'], tags: [] },

            // ❄️ COLD CLEAR TEAS
            { name: 'Hibiscus Iced Tea', price: 129, description: 'Chilled hibiscus tea, refreshing and fruity.', category: categoryMap['Cold Clear Teas'], tags: ['best-seller'] },
            { name: 'Lemon Iced Tea', price: 129, description: 'Classic iced tea with a hint of lemon.', category: categoryMap['Cold Clear Teas'], tags: [] },
            { name: 'Peach Iced Tea', price: 129, description: 'Sweet peach-flavored iced tea.', category: categoryMap['Cold Clear Teas'], tags: ['must-try'] },
            { name: 'Lemon Grass Ice Tea', price: 179, description: 'Iced tea with fresh lemongrass flavor.', category: categoryMap['Cold Clear Teas'], tags: ['new-intro'] },

            // 🥤 SHAKES (M/S – T/S)
            {
                name: 'Butterscotch Shake',
                description: 'Creamy butterscotch milkshake with crunchy bits.',
                category: categoryMap['Shakes'],
                tags: [],
                sizeOptions: [
                    { size: 'Medium Shake', price: 169 },
                    { size: 'Thick Shake', price: 249 }
                ]
            },
            {
                name: 'Kitkat Shake',
                description: 'Chocolate shake blended with Kitkat pieces.',
                category: categoryMap['Shakes'],
                tags: [],
                sizeOptions: [
                    { size: 'Medium Shake', price: 209 },
                    { size: 'Thick Shake', price: 269 }
                ]
            },
            {
                name: 'Oreo Shake',
                description: 'Cookies and cream shake with Oreo cookies.',
                category: categoryMap['Shakes'],
                tags: ['best-seller'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 209 },
                    { size: 'Thick Shake', price: 269 }
                ]
            },
            {
                name: 'Chocolate Shake',
                description: 'Rich and creamy chocolate milkshake.',
                category: categoryMap['Shakes'],
                tags: [],
                sizeOptions: [
                    { size: 'Medium Shake', price: 219 },
                    { size: 'Thick Shake', price: 279 }
                ]
            },
            {
                name: 'Tropical Trio Shake',
                description: 'A blend of tropical fruits in a creamy shake.',
                category: categoryMap['Shakes'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 229 },
                    { size: 'Thick Shake', price: 289 }
                ]
            },
            {
                name: 'American Bourbon Shake',
                description: 'Bourbon-flavored milkshake with a rich taste.',
                category: categoryMap['Shakes'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 229 },
                    { size: 'Thick Shake', price: 289 }
                ]
            },
            {
                name: 'Salted Caramel Shake',
                description: 'Sweet and salty caramel shake, perfectly balanced.',
                category: categoryMap['Shakes'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 229 },
                    { size: 'Thick Shake', price: 289 }
                ]
            },
            {
                name: 'Saffron Pistachio Shake',
                description: 'Exotic shake with saffron and pistachio flavors.',
                category: categoryMap['Shakes'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 229 },
                    { size: 'Thick Shake', price: 289 }
                ]
            },
            {
                name: 'Belgium Chocolate Shake',
                description: 'Premium shake with Belgium chocolate.',
                category: categoryMap['Shakes'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 249 },
                    { size: 'Thick Shake', price: 309 }
                ]
            },
            {
                name: 'Ferrero Rocher Shake',
                description: 'Luxurious shake with Ferrero Rocher chocolates.',
                category: categoryMap['Shakes'],
                tags: ['best-seller'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 249 },
                    { size: 'Thick Shake', price: 309 }
                ]
            },
            {
                name: 'Very Berry Shake',
                description: 'A blend of mixed berries in a creamy shake.',
                category: categoryMap['Shakes'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 269 },
                    { size: 'Thick Shake', price: 349 }
                ]
            },
            {
                name: 'Nutella Brownie Shake',
                description: 'Decadent shake with Nutella and brownie chunks.',
                category: categoryMap['Shakes'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: 'Medium Shake', price: 289 },
                    { size: 'Thick Shake', price: 369 }
                ]
            },
            {
                name: 'Avacado Treat Shake',
                description: 'Healthy and creamy avocado shake.',
                category: categoryMap['Shakes'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: 'One Size', price: 349 }
                ]
            },

            // 🍹 MOJITOS
            { name: 'Lemonade', price: 89, description: 'Fresh and tangy lemonade.', category: categoryMap['Mojitos'], tags: [] },
            { name: 'Guntur Spicy Mojito', price: 109, description: 'A spicy mojito with a kick from Guntur chilies.', category: categoryMap['Mojitos'], tags: ['must-try'] },
            { name: 'Mint Mojito', price: 159, description: 'Classic mojito with fresh mint leaves.', category: categoryMap['Mojitos'], tags: [] },
            { name: 'Blue Logon Mojito', price: 169, description: 'Vibrant blue lagoon mojito with citrus flavors.', category: categoryMap['Mojitos'], tags: [] },
            { name: 'Green Apple Mojito', price: 169, description: 'Refreshing mojito with green apple flavor.', category: categoryMap['Mojitos'], tags: [] },
            { name: 'Kiwi Mojito', price: 169, description: 'Tropical kiwi-flavored mojito.', category: categoryMap['Mojitos'], tags: [] },
            { name: 'Cranberry Mojito', price: 169, description: 'Tart cranberry mojito with mint.', category: categoryMap['Mojitos'], tags: ['best-seller'] },
            { name: 'Raspberry Mojito', price: 169, description: 'Sweet raspberry mojito with a fruity twist.', category: categoryMap['Mojitos'], tags: [] },
            { name: 'Berry Apricot Mojito', price: 179, description: 'Mixed berry and apricot mojito.', category: categoryMap['Mojitos'], tags: ['new-intro'] },
            { name: 'Lemon Grass Mojito', price: 179, description: 'Refreshing mojito with fresh lemongrass.', category: categoryMap['Mojitos'], tags: ['new-intro'] },
            { name: 'Apple Mint Mojito', price: 179, description: 'Apple and mint mojito, crisp and refreshing.', category: categoryMap['Mojitos'], tags: ['new-intro'] },
            { name: 'Yuzu Basil Lemonade', price: 179, description: 'Exotic yuzu and basil lemonade.', category: categoryMap['Mojitos'], tags: ['new-intro'] },

            // 🍉 REAL FRUIT MOJITOS
            { name: 'Pomegranate Mojito', price: 199, description: 'Fresh pomegranate mojito with real fruit.', category: categoryMap['Real Fruit Mojitos'], tags: ['new-intro'] },
            { name: 'Green grapes Mojito', price: 199, description: 'Mojito made with fresh green grapes.', category: categoryMap['Real Fruit Mojitos'], tags: ['new-intro'] },
            { name: 'Musk melon Mojito', price: 199, description: 'Sweet muskmelon mojito with real fruit.', category: categoryMap['Real Fruit Mojitos'], tags: ['new-intro'] },
            { name: 'Kiwi Fruit Mojito', price: 199, description: 'Fresh kiwi mojito with real kiwi pieces.', category: categoryMap['Real Fruit Mojitos'], tags: ['new-intro'] },
            { name: 'Watermelon Mojito', price: 199, description: 'Refreshing watermelon mojito with fresh fruit.', category: categoryMap['Real Fruit Mojitos'], tags: ['new-intro'] },

            // 🌰 ALMOND GUM SPECIAL
            { name: 'Almond gum Lemonade', price: 199, description: 'Lemonade with almond gum for texture.', category: categoryMap['Almond Gum Special'], tags: ['new-intro'] },
            { name: 'Almond gum Raspberry Mojito', price: 199, description: 'Raspberry mojito with almond gum.', category: categoryMap['Almond Gum Special'], tags: ['new-intro'] },
            { name: 'Almond gum Cranberry Mojito', price: 199, description: 'Cranberry mojito with almond gum.', category: categoryMap['Almond Gum Special'], tags: ['new-intro'] },
            { name: 'Almond gum Green Apple Mojito', price: 199, description: 'Green apple mojito with almond gum.', category: categoryMap['Almond Gum Special'], tags: ['new-intro'] },
            { name: 'Almond gum Strawberry Mojito', price: 199, description: 'Strawberry mojito with almond gum.', category: categoryMap['Almond Gum Special'], tags: ['new-intro'] },

            // 🥛 LASSI
            { name: 'Sweet and Salt Lassi', price: 99, description: 'Traditional yogurt-based lassi, sweet or salty.', category: categoryMap['Lassi'], tags: ['new-intro'] },
            { name: 'Dry Fruit Lassi', price: 149, description: 'Rich lassi loaded with dry fruits.', category: categoryMap['Lassi'], tags: ['new-intro'] },
            { name: 'Kiwi Lassi', price: 129, description: 'Fruity lassi with kiwi flavor.', category: categoryMap['Lassi'], tags: ['new-intro'] },
            { name: 'Caramel Lassi', price: 149, description: 'Sweet caramel-flavored lassi.', category: categoryMap['Lassi'], tags: ['new-intro'] },

            // 🧃 COLD PRESSED JUICES
            { name: 'Watermelon Juice', price: 109, description: 'Fresh cold-pressed watermelon juice.', category: categoryMap['Cold Pressed Juices'], tags: ['best-seller'] },
            { name: 'Watermelon + Lemon + Mint Juice', price: 139, description: 'Watermelon juice with lemon and mint.', category: categoryMap['Cold Pressed Juices'], tags: [] },
            { name: 'Grape Juice', price: 189, description: 'Fresh cold-pressed grape juice.', category: categoryMap['Cold Pressed Juices'], tags: ['must-try'] },
            { name: 'Muskmelon Juice', price: 159, description: 'Sweet muskmelon juice (on availability).', category: categoryMap['Cold Pressed Juices'], tags: [] },
            { name: 'Beetroot + Carrot Juice', price: 189, description: 'Healthy mix of beetroot and carrot juice.', category: categoryMap['Cold Pressed Juices'], tags: [] },
            { name: 'Apple + Beetroot + Carrot Juice', price: 229, description: 'Nutritious blend of apple, beetroot, and carrot.', category: categoryMap['Cold Pressed Juices'], tags: ['must-try'] },

            // 🍓 FRUIT BOWLS
            { name: 'Watermelon Salad', price: 129, description: 'Fresh watermelon salad with mint.', category: categoryMap['Fruit Bowls'], tags: ['new-intro'] },
            { name: 'Mix Fruit Salad', price: 199, description: 'A colorful mix of seasonal fresh fruits.', category: categoryMap['Fruit Bowls'], tags: ['new-intro'] },
            { name: 'Choco Banana Smoothie Bowl', price: 259, description: 'Smoothie bowl with chocolate and banana.', category: categoryMap['Fruit Bowls'], tags: ['new-intro'] },
            { name: 'Berry Smoothie Bowl', price: 299, description: 'Smoothie bowl with mixed berries and toppings.', category: categoryMap['Fruit Bowls'], tags: ['new-intro'] },

            // 🍛 CURRY RICE BOWLS
            { name: 'Jeera Rice + Masala Dal Gravy', price: 249, description: 'Cumin rice with spiced dal gravy.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro'] },
            { name: 'Lemon Fusion Rice + Tadhka Dahi', price: 309, description: 'Lemon rice with tempered yogurt.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro'] },
            { name: 'Herbed Rice + Rich Tomato Gravy', price: 349, description: 'Herb-infused rice with rich tomato curry.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro'] },
            { name: 'Palak Rice + Tandoor Gravy', price: 349, description: 'Spinach rice with tandoori gravy.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro'] },
            { name: 'Mediterranean Rice + Panner Makhani Gravy', price: 349, description: 'Mediterranean rice with creamy paneer makhani.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro'] },
            { name: 'Burnt Garlic Rice + Soya Makhani Gravy', price: 349, description: 'Burnt garlic rice with soya makhani gravy.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro'] },
            { name: 'Sauteed Rice + Omlette Gravy', price: 349, description: 'Sautéed rice with omelette curry.', category: categoryMap['Curry Rice Bowls'], tags: ['new-intro', 'egg-contains'] },

            // 🍚 RICE BOWLS
            { name: 'Jeera Rice', price: 169, description: 'Simple cumin-flavored rice.', category: categoryMap['Rice Bowls'], tags: [] },
            { name: 'Dum Aloo Rice', price: 199, description: 'Rice with spiced potato curry.', category: categoryMap['Rice Bowls'], tags: [] },
            { name: 'Vegetable Rice', price: 209, description: 'Rice cooked with mixed vegetables.', category: categoryMap['Rice Bowls'], tags: [] },
            { name: 'Vegetable Masala Rice', price: 219, description: 'Spiced vegetable rice with masala.', category: categoryMap['Rice Bowls'], tags: ['best-seller'] },
            { name: 'Mutter Panner Rice', price: 219, description: 'Rice with peas and paneer curry.', category: categoryMap['Rice Bowls'], tags: [] },
            { name: 'Mushroom Masala Rice', price: 249, description: 'Rice with spicy mushroom masala.', category: categoryMap['Rice Bowls'], tags: ['must-try'] },
            { name: 'Razma Loaded Brown Rice', price: 299, description: 'Brown rice with kidney bean curry.', category: categoryMap['Rice Bowls'], tags: [] },
            { name: 'Veg Aroma Rice Bowl', price: 299, description: 'Aromatic vegetable rice bowl.', category: categoryMap['Rice Bowls'], tags: [] },
            { name: 'Egg Rice Bowl', price: 209, description: 'Rice bowl with egg curry.', category: categoryMap['Rice Bowls'], tags: ['egg-contains'] },
            { name: 'Double Egg Rice Bowl', price: 239, description: 'Rice bowl with double egg curry.', category: categoryMap['Rice Bowls'], tags: ['best-seller', 'egg-contains'] },

            // 🔥 SIZZLERS
            { name: 'Veg Sizzler', price: 259, description: 'Sizzling platter with assorted vegetables.', category: categoryMap['Sizzlers'], tags: [] },
            { name: 'Italian Sizzler', price: 299, description: 'Italian-style sizzler with pasta and vegetables.', category: categoryMap['Sizzlers'], tags: ['best-seller'] },
            { name: 'Egg Sizzler', price: 299, description: 'Sizzler with eggs and vegetables.', category: categoryMap['Sizzlers'], tags: ['must-try', 'egg-contains'] },

            // 🍳 OMLETTES
            { name: 'Boiled Egg (2)', price: 49, description: 'Two boiled eggs.', category: categoryMap['Omlettes'], tags: ['egg-contains'] },
            { name: 'Half Boil Omlette', price: 59, description: 'Half-boiled egg omelette.', category: categoryMap['Omlettes'], tags: ['egg-contains'] },
            { name: 'Turkish Eggs', price: 129, description: 'Turkish-style poached eggs with yogurt.', category: categoryMap['Omlettes'], tags: ['new-intro', 'egg-contains'] },
            { name: 'Masala Omlette', price: 129, description: 'Spiced Indian-style omelette.', category: categoryMap['Omlettes'], tags: ['egg-contains'] },
            { name: 'Boiled Egg Omlette', price: 159, description: 'Omelette with boiled egg pieces.', category: categoryMap['Omlettes'], tags: ['best-seller', 'egg-contains'] },
            { name: 'Cheese Masala Omlette', price: 149, description: 'Spicy omelette with melted cheese.', category: categoryMap['Omlettes'], tags: ['must-try', 'egg-contains'] },
            { name: 'Spinach Mushroom Omlette', price: 199, description: 'Healthy omelette with spinach and mushrooms.', category: categoryMap['Omlettes'], tags: ['egg-contains'] },
            { name: 'Makhani Omlette', price: 199, description: 'Omelette in creamy makhani sauce.', category: categoryMap['Omlettes'], tags: ['new-intro', 'egg-contains'] },
            { name: 'Roy Omlette', price: 199, description: 'Special Roy-style omelette.', category: categoryMap['Omlettes'], tags: ['new-intro', 'egg-contains'] },
            { name: 'Fluffy Omlette', price: 199, description: 'Light and fluffy soufflé-style omelette.', category: categoryMap['Omlettes'], tags: ['egg-contains'] },
            { name: 'Potato Spanish Omlette', price: 199, description: 'Spanish-style potato omelette.', category: categoryMap['Omlettes'], tags: ['egg-contains'] },

            // 🍝 PASTA
            { name: 'Aglio Olio Pasta', price: 219, description: 'Classic Italian pasta with garlic and olive oil.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Alfredo Classic Pasta - White', price: 269, description: 'Creamy white Alfredo pasta.', category: categoryMap['Pasta'], tags: ['best-seller'] },
            { name: 'Florance Tomato Pasta - Red', price: 269, description: 'Tomato-based red sauce pasta.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Mixto Sauce Pasta - Pink', price: 319, description: 'Pink sauce pasta with mixed flavors.', category: categoryMap['Pasta'], tags: ['must-try'] },
            { name: 'Mushroom Cream Pasta - White', price: 319, description: 'White cream pasta with mushrooms.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Spinach Cream Pasta - White', price: 319, description: 'Creamy white pasta with spinach.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Biance Loaded Pasta - White', price: 329, description: 'Loaded white sauce pasta.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Roso Loaded Pasta - Red', price: 329, description: 'Loaded red sauce pasta.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Creamy Rustic Brocoli - Pink', price: 349, description: 'Pink sauce pasta with broccoli.', category: categoryMap['Pasta'], tags: ['must-try'] },
            { name: 'Mixto Veggie Pasta - Pink', price: 349, description: 'Pink sauce pasta with mixed vegetables.', category: categoryMap['Pasta'], tags: [] },
            { name: 'Makhani Pasta', price: 349, description: 'Pasta in creamy Indian makhani sauce.', category: categoryMap['Pasta'], tags: [] },

            // 🍕 PIZZA (6" and 9" sizes)
            {
                name: 'Margherita Pizza',
                description: 'Classic pizza with tomato sauce and cheese.',
                category: categoryMap['Pizza'],
                tags: [],
                sizeOptions: [
                    { size: '6 inch', price: 159 },
                    { size: '9 inch', price: 229 }
                ]
            },
            {
                name: 'Corn Burst Pizza',
                description: 'Pizza loaded with sweet corn.',
                category: categoryMap['Pizza'],
                tags: [],
                sizeOptions: [
                    { size: '6 inch', price: 219 },
                    { size: '9 inch', price: 279 }
                ]
            },
            {
                name: 'Maharaja Pizza',
                description: 'Royal pizza with Indian spices and vegetables.',
                category: categoryMap['Pizza'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: '6 inch', price: 229 },
                    { size: '9 inch', price: 289 }
                ]
            },
            {
                name: 'Napoli Classic Pizza',
                description: 'Classic Napoli-style pizza.',
                category: categoryMap['Pizza'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: '6 inch', price: 259 },
                    { size: '9 inch', price: 329 }
                ]
            },
            {
                name: 'Manali Pizza',
                description: 'Special Manali-style pizza.',
                category: categoryMap['Pizza'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: '6 inch', price: 269 },
                    { size: '9 inch', price: 349 }
                ]
            },
            {
                name: 'Casa Mellino Pizza',
                description: 'Gourmet pizza with special toppings.',
                category: categoryMap['Pizza'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: '6 inch', price: 299 },
                    { size: '9 inch', price: 389 }
                ]
            },
            {
                name: 'Veggie Supreme Pizza',
                description: 'Pizza loaded with assorted vegetables.',
                category: categoryMap['Pizza'],
                tags: ['must-try'],
                sizeOptions: [
                    { size: '6 inch', price: 279 },
                    { size: '9 inch', price: 359 }
                ]
            },
            {
                name: 'Tikka Panner Pizza',
                description: 'Pizza with spicy tikka paneer.',
                category: categoryMap['Pizza'],
                tags: ['best-seller'],
                sizeOptions: [
                    { size: '6 inch', price: 289 },
                    { size: '9 inch', price: 369 }
                ]
            },
            {
                name: 'Scrambled Delight Pizza',
                description: 'Pizza with scrambled eggs.',
                category: categoryMap['Pizza'],
                tags: ['new-intro', 'egg-contains'],
                sizeOptions: [
                    { size: '6 inch', price: 299 },
                    { size: '9 inch', price: 389 }
                ]
            },

            // 🌾 MILLET KITCHIDI
            { name: 'Plain Dal Kitchidi', price: 199, description: 'Healthy millet kitchidi with dal.', category: categoryMap['Millet Kitchidi'], tags: ['new-intro'] },
            { name: 'Vegetable Kitchidi', price: 249, description: 'Millet kitchidi with mixed vegetables.', category: categoryMap['Millet Kitchidi'], tags: ['new-intro'] },
            { name: 'Palak Kitchidi', price: 289, description: 'Nutritious millet kitchidi with spinach.', category: categoryMap['Millet Kitchidi'], tags: ['new-intro'] },
            { name: 'Panner Kitchidi', price: 299, description: 'Millet kitchidi with paneer.', category: categoryMap['Millet Kitchidi'], tags: ['new-intro'] },

            // 🌯 WRAPS
            { name: 'Veggie Wrap', price: 199, description: 'Fresh vegetable wrap.', category: categoryMap['Wraps'], tags: [] },
            { name: 'Veggie Cheese Wrap', price: 199, description: 'Vegetable wrap with cheese.', category: categoryMap['Wraps'], tags: [] },
            { name: 'Panner Wrap', price: 249, description: 'Wrap filled with spiced paneer.', category: categoryMap['Wraps'], tags: ['new-intro'] },
            { name: 'Makhani Soya Chaap Wrap', price: 249, description: 'Soya chaap in makhani sauce wrap.', category: categoryMap['Wraps'], tags: ['new-intro'] },
            { name: 'Egg Masala Wrap', price: 249, description: 'Spicy egg masala wrap.', category: categoryMap['Wraps'], tags: ['best-seller', 'egg-contains'] },

            // 🥪 SANDWICH (with meal options)
            {
                name: 'Bombay Grilled Sandwich',
                description: 'Classic Bombay-style grilled sandwich.',
                category: categoryMap['Sandwich'],
                tags: [],
                sizeOptions: [
                    { size: 'Regular', price: 149 },
                    { size: 'Meal', price: 249 }
                ]
            },
            {
                name: 'Cheese Grilled Sandwich',
                description: 'Grilled sandwich with melted cheese.',
                category: categoryMap['Sandwich'],
                tags: [],
                sizeOptions: [
                    { size: 'Regular', price: 149 },
                    { size: 'Meal', price: 249 }
                ]
            },
            {
                name: 'Chocolate Grilled Sandwich',
                description: 'Sweet grilled sandwich with chocolate.',
                category: categoryMap['Sandwich'],
                tags: [],
                sizeOptions: [
                    { size: 'Regular', price: 159 },
                    { size: 'Meal', price: 259 }
                ]
            },
            {
                name: 'Panner Chilli Grilled Sandwich',
                description: 'Spicy grilled sandwich with paneer and chilli.',
                category: categoryMap['Sandwich'],
                tags: ['best-seller'],
                sizeOptions: [
                    { size: 'Regular', price: 179 },
                    { size: 'Meal', price: 279 }
                ]
            },
            {
                name: 'Corn Spinach Grilled Sandwich',
                description: 'Healthy grilled sandwich with corn and spinach.',
                category: categoryMap['Sandwich'],
                tags: ['best-seller'],
                sizeOptions: [
                    { size: 'Regular', price: 179 },
                    { size: 'Meal', price: 279 }
                ]
            },
            {
                name: 'Exotic Pizza Grilled Sandwich',
                description: 'Pizza-style grilled sandwich with exotic toppings.',
                category: categoryMap['Sandwich'],
                tags: [],
                sizeOptions: [
                    { size: 'Regular', price: 189 },
                    { size: 'Meal', price: 289 }
                ]
            },
            {
                name: 'Mushroom Grilled Sandwich',
                description: 'Grilled sandwich with sautéed mushrooms.',
                category: categoryMap['Sandwich'],
                tags: [],
                sizeOptions: [
                    { size: 'Regular', price: 199 },
                    { size: 'Meal', price: 299 }
                ]
            },
            {
                name: 'Fried Cheese Potato Sandwich',
                description: 'Fried sandwich with cheese and potato.',
                category: categoryMap['Sandwich'],
                tags: ['egg-contains'],
                sizeOptions: [
                    { size: 'Regular', price: 209 },
                    { size: 'Meal', price: 309 }
                ]
            },
            {
                name: 'Boiled Egg Grilled Sandwich',
                description: 'Grilled sandwich with boiled eggs.',
                category: categoryMap['Sandwich'],
                tags: ['must-try', 'egg-contains'],
                sizeOptions: [
                    { size: 'Regular', price: 179 },
                    { size: 'Meal', price: 279 }
                ]
            },
            {
                name: 'Scrambled Egg Grilled Sandwich',
                description: 'Grilled sandwich with scrambled eggs.',
                category: categoryMap['Sandwich'],
                tags: ['egg-contains'],
                sizeOptions: [
                    { size: 'Regular', price: 199 },
                    { size: 'Meal', price: 299 }
                ]
            },

            // 🍜 MAGGI
            { name: 'Plain Maggi', price: 99, description: 'Classic plain Maggi noodles.', category: categoryMap['Maggi'], tags: [] },
            { name: 'Vegetable Maggi', price: 129, description: 'Maggi with mixed vegetables.', category: categoryMap['Maggi'], tags: [] },
            { name: 'Lemon Corriander Maggi', price: 149, description: 'Maggi with lemon and coriander flavor.', category: categoryMap['Maggi'], tags: ['new-intro'] },
            { name: 'Biryani Maggi', price: 189, description: 'Maggi with biryani-style spices.', category: categoryMap['Maggi'], tags: ['best-seller'] },
            { name: 'Garlic cheese Masala Maggi', price: 169, description: 'Maggi with garlic, cheese, and masala.', category: categoryMap['Maggi'], tags: ['new-intro'] },
            { name: 'Korean Style Maggi', price: 169, description: 'Maggi with Korean-style seasoning.', category: categoryMap['Maggi'], tags: ['new-intro'] },
            { name: 'Maggi Ramen Bowl - Panner', price: 199, description: 'Ramen-style Maggi bowl with paneer.', category: categoryMap['Maggi'], tags: ['new-intro'] },
            { name: 'Maggi Ramen Bowl - Egg', price: 199, description: 'Ramen-style Maggi bowl with egg.', category: categoryMap['Maggi'], tags: ['new-intro', 'egg-contains'] },
            { name: 'Cheese Maggi', price: 149, description: 'Maggi topped with melted cheese.', category: categoryMap['Maggi'], tags: [] },
            { name: 'Tnt Spl Egg Maggi', price: 199, description: 'Special Teas N Trees egg Maggi.', category: categoryMap['Maggi'], tags: ['egg-contains'] },

            // 🍔 BURGERS (with meal options)
            {
                name: 'Panner Pita Burger',
                description: 'Pita-style burger with paneer patty.',
                category: categoryMap['Burgers'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: 'Regular', price: 149 },
                    { size: 'Meal', price: 249 }
                ]
            },
            {
                name: 'Soya Chaap Pita Burger',
                description: 'Pita burger with soya chaap filling.',
                category: categoryMap['Burgers'],
                tags: ['new-intro'],
                sizeOptions: [
                    { size: 'Regular', price: 169 },
                    { size: 'Meal', price: 269 }
                ]
            },
            {
                name: 'Veg Grilled Burger',
                description: 'Grilled vegetable burger.',
                category: categoryMap['Burgers'],
                tags: ['best-seller'],
                sizeOptions: [
                    { size: 'Regular', price: 149 },
                    { size: 'Meal', price: 249 }
                ]
            },
            {
                name: 'Panner Grilled Burger',
                description: 'Grilled burger with paneer patty.',
                category: categoryMap['Burgers'],
                tags: [],
                sizeOptions: [
                    { size: 'Regular', price: 169 },
                    { size: 'Meal', price: 269 }
                ]
            },
            {
                name: 'Egg Pita Burger',
                description: 'Pita-style burger with egg.',
                category: categoryMap['Burgers'],
                tags: ['new-intro', 'egg-contains'],
                sizeOptions: [
                    { size: 'Regular', price: 169 },
                    { size: 'Meal', price: 269 }
                ]
            },
            {
                name: 'Egg Grilled Burger',
                description: 'Grilled burger with egg patty.',
                category: categoryMap['Burgers'],
                tags: ['must-try', 'egg-contains'],
                sizeOptions: [
                    { size: 'Regular', price: 169 },
                    { size: 'Meal', price: 269 }
                ]
            },
        ];

        console.log('Seeding products...');
        const result = await Product.insertMany(products);
        console.log(`✅ Successfully seeded ${result.length} products!`);

        // Group products by category for summary
        const productsByCategory = {};
        for (const product of result) {
            const cat = categories.find(c => c._id.equals(product.category));
            if (cat) {
                if (!productsByCategory[cat.name]) {
                    productsByCategory[cat.name] = [];
                }
                productsByCategory[cat.name].push(product);
            }
        }

        console.log('\n📊 Products by Category:');
        Object.keys(productsByCategory).forEach(catName => {
            console.log(`\n${catName}: ${productsByCategory[catName].length} items`);
        });

        mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed');
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedProducts();
