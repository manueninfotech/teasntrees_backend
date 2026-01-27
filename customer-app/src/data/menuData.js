// TeasNTrees Menu Data
// Dummy data for menu items across different categories

export const menuData = [
    // Tea Category
    {
        id: 1,
        name: "Masala Chai",
        category: "Tea",
        price: 60,
        description: "Traditional Indian spiced tea with aromatic blend of cardamom, ginger, and cinnamon. Perfectly brewed with premium tea leaves.",
        image: "masala-chai"
    },
    {
        id: 2,
        name: "Green Tea",
        category: "Tea",
        price: 50,
        description: "Refreshing organic green tea rich in antioxidants. Light and soothing with natural flavors.",
        image: "green-tea"
    },
    {
        id: 3,
        name: "Lemon Tea",
        category: "Tea",
        price: 55,
        description: "Zesty lemon-infused tea with a perfect balance of citrus and sweetness. Refreshing and energizing.",
        image: "lemon-tea"
    },
    {
        id: 4,
        name: "Ginger Tea",
        category: "Tea",
        price: 55,
        description: "Warming ginger tea with natural healing properties. Perfect for cold days and soothing the throat.",
        image: "ginger-tea"
    },
    {
        id: 5,
        name: "Mint Tea",
        category: "Tea",
        price: 50,
        description: "Cool and refreshing mint tea with fresh mint leaves. Naturally caffeine-free and calming.",
        image: "mint-tea"
    },
    {
        id: 6,
        name: "Earl Grey",
        category: "Tea",
        price: 65,
        description: "Classic Earl Grey with bergamot essence. Sophisticated and aromatic black tea blend.",
        image: "earl-grey"
    },

    // Coffee Category
    {
        id: 7,
        name: "Espresso",
        category: "Coffee",
        price: 70,
        description: "Rich and bold espresso shot made from premium Arabica beans. Intense flavor and smooth finish.",
        image: "espresso"
    },
    {
        id: 8,
        name: "Cappuccino",
        category: "Coffee",
        price: 90,
        description: "Classic cappuccino with perfectly steamed milk and velvety foam. Balanced and creamy.",
        image: "cappuccino"
    },
    {
        id: 9,
        name: "Latte",
        category: "Coffee",
        price: 95,
        description: "Smooth and creamy latte with espresso and steamed milk. Mild and comforting.",
        image: "latte"
    },
    {
        id: 10,
        name: "Americano",
        category: "Coffee",
        price: 75,
        description: "Bold espresso diluted with hot water. Strong coffee flavor with smooth finish.",
        image: "americano"
    },
    {
        id: 11,
        name: "Mocha",
        category: "Coffee",
        price: 100,
        description: "Indulgent chocolate-infused coffee with espresso, steamed milk, and cocoa. Sweet and rich.",
        image: "mocha"
    },
    {
        id: 12,
        name: "Cold Brew",
        category: "Coffee",
        price: 110,
        description: "Smooth cold brew coffee steeped for 12 hours. Less acidic and naturally sweet.",
        image: "cold-brew"
    },

    // Snacks Category
    {
        id: 13,
        name: "Veg Sandwich",
        category: "Snacks",
        price: 80,
        description: "Fresh vegetable sandwich with cucumber, tomato, lettuce, and special mint chutney. Served toasted.",
        image: "veg-sandwich"
    },
    {
        id: 14,
        name: "Cheese Sandwich",
        category: "Snacks",
        price: 90,
        description: "Grilled cheese sandwich with melted cheddar and mozzarella. Crispy and gooey.",
        image: "cheese-sandwich"
    },
    {
        id: 15,
        name: "Samosa",
        category: "Snacks",
        price: 40,
        description: "Crispy fried pastry filled with spiced potatoes and peas. Served with tangy tamarind chutney.",
        image: "samosa"
    },
    {
        id: 16,
        name: "Pakora",
        category: "Snacks",
        price: 60,
        description: "Mixed vegetable fritters in spiced chickpea batter. Crispy and flavorful.",
        image: "pakora"
    },
    {
        id: 17,
        name: "Spring Rolls",
        category: "Snacks",
        price: 85,
        description: "Crispy vegetable spring rolls with sweet chili sauce. Light and crunchy.",
        image: "spring-rolls"
    },
    {
        id: 18,
        name: "Garlic Bread",
        category: "Snacks",
        price: 70,
        description: "Toasted bread with garlic butter and herbs. Aromatic and delicious.",
        image: "garlic-bread"
    },

    // Desserts Category
    {
        id: 19,
        name: "Chocolate Brownie",
        category: "Desserts",
        price: 95,
        description: "Fudgy chocolate brownie with walnuts. Rich, moist, and decadent.",
        image: "brownie"
    },
    {
        id: 20,
        name: "Cheesecake",
        category: "Desserts",
        price: 120,
        description: "Creamy New York style cheesecake with graham cracker crust. Smooth and indulgent.",
        image: "cheesecake"
    },
    {
        id: 21,
        name: "Chocolate Chip Cookies",
        category: "Desserts",
        price: 60,
        description: "Freshly baked cookies with chocolate chips. Crispy outside, soft inside.",
        image: "cookies"
    },
    {
        id: 22,
        name: "Tiramisu",
        category: "Desserts",
        price: 130,
        description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream.",
        image: "tiramisu"
    },
    {
        id: 23,
        name: "Apple Pie",
        category: "Desserts",
        price: 100,
        description: "Homemade apple pie with cinnamon and flaky crust. Served warm with vanilla ice cream.",
        image: "apple-pie"
    },
    {
        id: 24,
        name: "Muffin",
        category: "Desserts",
        price: 55,
        description: "Freshly baked blueberry muffin. Moist and fluffy with bursts of berries.",
        image: "muffin"
    }
];

// Get all unique categories
export const categories = ["All", ...new Set(menuData.map(item => item.category))];

// Helper function to get items by category
export const getItemsByCategory = (category) => {
    if (category === "All") return menuData;
    return menuData.filter(item => item.category === category);
};

// Helper function to get item by ID
export const getItemById = (id) => {
    return menuData.find(item => item.id === id);
};
