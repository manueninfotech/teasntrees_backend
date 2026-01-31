import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
// Note: We can't easily use useAuth here if AuthProvider uses CartProvider, but typically Auth is top level.
// However, to avoid circular deps or nesting issues, we can check auth status via token presence or pass it in.
// Better: The user snippet used useAuth inside CartProvider. Let's assume AuthProvider wraps CartProvider.

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    // Initialize state from local storage
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('cartItems');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Failed to load cart from local storage", error);
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    // Persist to local storage
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // Add Item Logic
    const addToCart = (product, sizeOption = null) => {
        setCartItems(prevItems => {
            const sizeLabel = sizeOption ? sizeOption.size : 'standard';
            const itemKey = `${product._id}-${sizeLabel}`;

            const existingItemIndex = prevItems.findIndex(item => item.key === itemKey);

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity += 1;
                return newItems;
            } else {
                return [...prevItems, {
                    key: itemKey,
                    id: product._id,
                    name: product.name,
                    image: product.image,
                    price: sizeOption ? sizeOption.price : (product.displayPrice || product.price),
                    size: sizeOption ? sizeOption.size : null,
                    quantity: 1,
                    description: product.description,
                    category: product.category?.name
                }];
            }
        });
        setIsCartOpen(true);
    };

    // Update Quantity
    const updateQuantity = (itemKey, delta) => {
        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.key === itemKey) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    // Remove Item
    const removeFromCart = (itemKey) => {
        setCartItems(prevItems => prevItems.filter(item => item.key !== itemKey));
    };

    // Clear Cart
    const clearCart = () => {
        setCartItems([]);
    };

    // Checkout Logic (Bridging Frontend Cart -> Backend Order)
    const checkout = async (checkoutData) => {
        // Construct full payload expected by backend
        const orderPayload = {
            ...checkoutData,
            items: cartItems.map(item => ({
                product: item.id, // backend expects 'product' ID
                quantity: item.quantity,
                price: item.price,
                customization: item.size || ''
            }))
        };

        try {
            const response = await orderService.createOrder(orderPayload);
            if (response && (response.success || response.orderId)) { // Adjust based on actual response structure
                clearCart();
                return { success: true, data: response }; // Standardize response
            }
            // If response doesn't look successful but didn't throw?
            return { success: true, data: response };
        } catch (error) {
            console.error("Checkout failed in Context:", error);

            // Handle "Product not found" (404) specifically
            if (error.response && error.response.status === 404) {
                // Only clear coverage if we are sure it's a stale cart issue
                // For now, let's just re-throw with a clear message
                throw new Error("Some items in your cart are no longer available. Please clear your cart and try again.");
            }
            throw error;
        }
    };

    // Derived State
    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            checkout, // Exposed method
            cartTotal,
            cartCount,
            isCartOpen,
            toggleCart,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
};
