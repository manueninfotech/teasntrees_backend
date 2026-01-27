// TeasNTrees Cart Context
// Global state management for shopping cart with backend synchronization

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';

const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    // Initialize cart from localStorage if available
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('teasntrees_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('teasntrees_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Sync cart with backend when user logs in
    useEffect(() => {
        const syncCartWithBackend = async () => {
            if (isAuthenticated && !isSynced) {
                setIsLoading(true);
                try {
                    // Get backend cart
                    const backendCart = await cartService.getCart();

                    // Get localStorage cart
                    const localCart = cartItems;

                    // Merge carts: Add localStorage items to backend cart
                    if (localCart.length > 0) {
                        for (const item of localCart) {
                            try {
                                await cartService.addToCart({
                                    productId: item.id,
                                    quantity: item.quantity,
                                    customization: item.customization || ''
                                });
                            } catch (error) {
                                console.error('Error syncing item to backend:', error);
                            }
                        }

                        // Fetch updated cart after merge
                        const updatedCart = await cartService.getCart();

                        // Transform backend cart to match frontend format
                        const transformedCart = updatedCart.data?.items?.map(item => ({
                            id: item.product._id,
                            name: item.product.name,
                            price: item.price,
                            image: item.product.image,
                            quantity: item.quantity,
                            customization: item.customization,
                            _cartItemId: item._id // Store backend cart item ID
                        })) || [];

                        setCartItems(transformedCart);
                    } else if (backendCart.data?.items?.length > 0) {
                        // No local cart, just use backend cart
                        const transformedCart = backendCart.data.items.map(item => ({
                            id: item.product._id,
                            name: item.product.name,
                            price: item.price,
                            image: item.product.image,
                            quantity: item.quantity,
                            customization: item.customization,
                            _cartItemId: item._id
                        }));

                        setCartItems(transformedCart);
                    }

                    setIsSynced(true);
                } catch (error) {
                    console.error('Error syncing cart with backend:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        syncCartWithBackend();
    }, [isAuthenticated, isSynced]);

    // Reset sync status when user logs out
    useEffect(() => {
        if (!isAuthenticated) {
            setIsSynced(false);
        }
    }, [isAuthenticated]);

    // Add item to cart
    const addToCart = async (item, quantity = 1, customization = '') => {
        // Optimistic update
        const prevCartItems = [...cartItems];
        const existingItemIndex = cartItems.findIndex(cartItem =>
            cartItem.id === item.id && cartItem.customization === customization
        );

        let optimisticCart;
        if (existingItemIndex > -1) {
            optimisticCart = cartItems.map((cartItem, index) =>
                index === existingItemIndex
                    ? { ...cartItem, quantity: cartItem.quantity + quantity }
                    : cartItem
            );
        } else {
            optimisticCart = [...cartItems, { ...item, quantity, customization }];
        }

        setCartItems(optimisticCart);

        if (isAuthenticated) {
            try {
                const response = await cartService.addToCart({
                    productId: item.id,
                    quantity,
                    customization
                });

                const transformedCart = response.data?.items?.map(cartItem => ({
                    id: cartItem.product._id,
                    name: cartItem.product.name,
                    price: cartItem.price,
                    image: cartItem.product.image,
                    quantity: cartItem.quantity,
                    customization: cartItem.customization,
                    _cartItemId: cartItem._id
                })) || [];

                setCartItems(transformedCart);
            } catch (error) {
                console.error('Error adding to cart:', error);
                // Rollback on error
                setCartItems(prevCartItems);
                throw error;
            }
        }
    };

    // Update item quantity
    const updateQuantity = async (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        // Optimistic update
        const prevCartItems = [...cartItems];
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );

        if (isAuthenticated) {
            try {
                const item = cartItems.find(i => i.id === itemId);
                if (item && item._cartItemId) {
                    const response = await cartService.updateCartItem(item._cartItemId, newQuantity);

                    const transformedCart = response.data?.items?.map(cartItem => ({
                        id: cartItem.product._id,
                        name: cartItem.product.name,
                        price: cartItem.price,
                        image: cartItem.product.image,
                        quantity: cartItem.quantity,
                        customization: cartItem.customization,
                        _cartItemId: cartItem._id
                    })) || [];

                    setCartItems(transformedCart);
                }
            } catch (error) {
                console.error('Error updating cart item:', error);
                // Rollback
                setCartItems(prevCartItems);
                throw error;
            }
        }
    };

    // Remove item from cart
    const removeFromCart = async (itemId) => {
        // Optimistic update
        const prevCartItems = [...cartItems];
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

        if (isAuthenticated) {
            try {
                const item = cartItems.find(i => i.id === itemId);
                if (item && item._cartItemId) {
                    const response = await cartService.removeCartItem(item._cartItemId);

                    const transformedCart = response.data?.items?.map(cartItem => ({
                        id: cartItem.product._id,
                        name: cartItem.product.name,
                        price: cartItem.price,
                        image: cartItem.product.image,
                        quantity: cartItem.quantity,
                        customization: cartItem.customization,
                        _cartItemId: cartItem._id
                    })) || [];

                    setCartItems(transformedCart);
                }
            } catch (error) {
                console.error('Error removing cart item:', error);
                // Rollback
                setCartItems(prevCartItems);
                throw error;
            }
        }
    };

    // Clear entire cart
    const clearCart = async () => {
        if (isAuthenticated) {
            try {
                await cartService.clearCart();
                setCartItems([]);
            } catch (error) {
                console.error('Error clearing cart:', error);
                throw error;
            }
        } else {
            setCartItems([]);
        }
    };

    // Checkout cart - place an order
    const checkout = async (checkoutData) => {
        if (!isAuthenticated) {
            throw new Error('User must be logged in to checkout');
        }

        try {
            const response = await cartService.checkoutCart(checkoutData);
            setCartItems([]); // Clear local cart after successful checkout
            return response;
        } catch (error) {
            console.error('Error during checkout:', error);
            throw error;
        }
    };

    // Get total number of items in cart
    const getCartCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    // Get total price of all items in cart
    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Check if item is in cart
    const isInCart = (itemId) => {
        return cartItems.some(item => item.id === itemId);
    };

    // Get quantity of specific item in cart
    const getItemQuantity = (itemId) => {
        const item = cartItems.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    };

    const value = {
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
        getCartCount,
        getCartTotal,
        isInCart,
        getItemQuantity,
        isLoading,
        isSynced
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
