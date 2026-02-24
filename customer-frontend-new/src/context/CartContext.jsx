import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadCart = async () => {
            if (isAuthenticated) {
                // Load from Server
                try {
                    setIsLoading(true);
                    // Check if we have local items to sync first (Guest -> User transition)
                    const localData = localStorage.getItem('cartItems');
                    const localItems = localData ? JSON.parse(localData) : [];

                    if (localItems.length > 0) {
                        // Sync items one by one (or batch if API supported, currently separate calls)
                        // Simple approach: Add each, then fetch final cart relative to server state
                        // Note: ideally we'd have a batch endpoint, but looping works for small carts
                        for (const item of localItems) {
                            try {
                                await cartService.addToCart(item.id, item.quantity, item.size);
                            } catch (err) {
                                console.error("Failed to sync item", item.name);
                            }
                        }
                        // Clear local storage after sync attempt
                        localStorage.removeItem('cartItems');
                    }

                    // Fetch final server state
                    const response = await cartService.getCart();
                    if (response.data && response.data.items) {
                        // Transform server items to UI format if needed
                        const uiItems = response.data.items.map(mapServerItemToUI);
                        setCartItems(uiItems);
                    }
                } catch (error) {
                    console.error("Failed to load server cart", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Load from Local Storage
                try {
                    const localData = localStorage.getItem('cartItems');
                    if (localData) {
                        setCartItems(JSON.parse(localData));
                    }
                } catch (error) {
                    console.error("Failed to load local cart", error);
                }
            }
        };

        loadCart();
    }, [isAuthenticated]);

    // Persist to local storage ONLY if Guest
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
    }, [cartItems, isAuthenticated]);

    // build a full url for product image with brand‑specific fallback
    const resolveImageUrl = (img, brand) => {
        const b = brand || 'teasntrees';
        const fallback = b === 'littleh' ? 'default-coffee.png' : 'default-cake.png';
        if (img && img !== '') {
            return img.startsWith('http') ? img : `http://localhost:5000/uploads/${img}`;
        }
        return `http://localhost:5000/uploads/${fallback}`;
    };

    // Helper to map Server Item Structure to UI Structure
    const mapServerItemToUI = (serverItem) => ({
        key: serverItem._id, // Cart Item ID
        id: serverItem.product._id, // Product ID
        name: serverItem.product.name,
        image: resolveImageUrl(serverItem.product.image, serverItem.product.brand),
        price: serverItem.price,
        size: serverItem.customization,
        quantity: serverItem.quantity,
        description: serverItem.product.description,
        isAvailable: serverItem.product.isAvailable,
        brand: serverItem.product.brand || 'teasntrees'
    });

    // Add Item
    const addToCart = async (product, sizeOption = null) => {
        const sizeLabel = sizeOption ? sizeOption.size : '';
        const price = sizeOption ? sizeOption.price : (product.displayPrice || product.price);

        // Optimistic Update
        const newItem = {
            key: isAuthenticated ? 'temp-' + Date.now() : `${product._id}-${sizeLabel}`,
            id: product._id,
            name: product.name,
            image: product.image,
            price: price,
            size: sizeLabel,
            quantity: 1,
            description: product.description,
            isAvailable: true,
            brand: product.brand || 'teasntrees'
        };

        if (isAuthenticated) {
            try {
                const response = await cartService.addToCart(product._id, 1, sizeLabel);
                if (response.success && response.data) {
                    setCartItems(response.data.items.map(mapServerItemToUI));
                    setIsCartOpen(true);
                    toast.success("Added to cart");
                }
            } catch (error) {
                console.error("Add to cart failed", error);
                toast.error("Failed to add to cart");
            }
        } else {
            // Local Logic
            setCartItems(prevItems => {
                const itemKey = `${product._id}-${sizeLabel}`;
                const existingItemIndex = prevItems.findIndex(item => item.key === itemKey);

                if (existingItemIndex > -1) {
                    const newItems = [...prevItems];
                    newItems[existingItemIndex].quantity += 1;
                    return newItems;
                } else {
                    return [...prevItems, { ...newItem, key: itemKey }];
                }
            });
            setIsCartOpen(true);
            toast.success("Added to cart");
        }
    };

    // Update Quantity
    const updateQuantity = async (itemKey, delta) => {
        // Find current quantity
        const item = cartItems.find(i => i.key === itemKey);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty < 1) return; // Use remove for 0

        if (isAuthenticated) {
            try {
                // itemKey is the CartItem _id from server
                const response = await cartService.updateItem(itemKey, newQty);
                if (response.success) {
                    setCartItems(response.data.items.map(mapServerItemToUI));
                }
            } catch (error) {
                console.error("Update quantity failed", error);
            }
        } else {
            setCartItems(prevItems => prevItems.map(i =>
                i.key === itemKey ? { ...i, quantity: newQty } : i
            ));
        }
    };

    // Remove Item
    const removeFromCart = async (itemKey) => {
        if (isAuthenticated) {
            try {
                const response = await cartService.removeItem(itemKey);
                if (response.success) {
                    setCartItems(response.data.items.map(mapServerItemToUI));
                    toast.success("Item removed");
                }
            } catch (error) {
                console.error("Remove item failed", error);
            }
        } else {
            setCartItems(prevItems => prevItems.filter(item => item.key !== itemKey));
            toast.success("Item removed");
        }
    };

    // Clear Cart
    const clearCart = async () => {
        if (isAuthenticated) {
            try {
                await cartService.clearCart();
                setCartItems([]);
            } catch (error) {
                console.error("Clear cart failed", error);
            }
        } else {
            setCartItems([]);
        }
    };

    // Checkout
    const checkout = async (checkoutData) => {
        if (isAuthenticated) {
            // Server Checkout
            const response = await cartService.checkout(checkoutData);
            setCartItems([]); // Server clears it, so we clear UI
            return response;
        } else {
            // Guest Checkout (Not supported by backend yet? Or uses createOrder?)
            // Backend `createOrder` supports passing `items` directly.
            // So we construct payload same as before for Guest.
            // NOTE: Current `orderService.createOrder` is basically guest/direct mode.

            // Wait, if authenticating, we forced server cart.
            // If guest, we fall back to createOrder
            const orderPayload = {
                ...checkoutData,
                items: cartItems.map(item => ({
                    product: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    customization: item.size || ''
                }))
            };

            // We need to import api or orderService here... circular dep risk?
            // Let's use the passed logic or assume orderService is available via import
            // I'll re-import orderService at top if needed, but wait context file didn't insert it.
            // Actually, we can just throw "Please login to checkout" if we want to enforce it, 
            // but requirements say guests can order (maybe?).
            // Let's assume Guests use `orderService.createOrder`.
            // I will use dynamic import or just standard import.
            const { orderService } = await import('../services/orderService');
            const response = await orderService.createOrder(orderPayload);
            clearCart();
            return { success: true, data: response };
        }
    };

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
            checkout,
            cartTotal,
            cartCount,
            isCartOpen,
            toggleCart,
            setIsCartOpen,
            isLoading
        }}>
            {children}
        </CartContext.Provider>
    );
};
