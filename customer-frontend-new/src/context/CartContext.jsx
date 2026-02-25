import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
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
    const { brand } = useBrand();
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

                    // Sync in-memory guest items if any
                    if (cartItems.length > 0) {
                        for (const item of cartItems) {
                            try {
                                await cartService.addToCart(
                                    item.id,
                                    item.quantity,
                                    item.customizationPayload || item.size
                                );
                            } catch (err) {
                                console.error("Failed to sync item", item.name);
                            }
                        }
                    }

                    // Fetch final server state
                    const response = await cartService.getCart();
                    if (response.data && response.data.items) {
                        const uiItems = response.data.items.map(mapServerItemToUI);
                        setCartItems(uiItems);
                    }
                } catch (error) {
                    console.error("Failed to load server cart", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // On logout or guest session, clear the cart items to ensure no leakage
                setCartItems([]);
            }
        };

        loadCart();
    }, [isAuthenticated]); // Only re-run when auth status changes. removed brand dep as it's unified now.


    // Helper to map Server Item Structure to UI Structure
    const mapServerItemToUI = (serverItem) => ({
        key: serverItem._id, // Cart Item ID
        id: serverItem.product._id, // Product ID
        name: serverItem.product.name,
        image: serverItem.product.image,
        price: serverItem.price,
        size: serverItem.customization,
        customizationPayload: serverItem.weight ? {
            type: 'cake',
            weight: serverItem.weight,
            isCustomized: Boolean(serverItem.isCustomized),
            isEggless: Boolean(serverItem.isEggless),
            customizationDetails: serverItem.customizationDetails || {}
        } : null,
        quantity: serverItem.quantity,
        description: serverItem.product.description,
        isAvailable: serverItem.product.isAvailable,
        brand: serverItem.product.brand || 'teasntrees'
    });

    // Add Item
    const addToCart = async (product, selectedOption = null) => {
        const isCakeOption = selectedOption?.type === 'cake';
        const sizeLabel = isCakeOption
            ? `${selectedOption.weight}kg${selectedOption.isCustomized ? ' | Customized' : ''}${selectedOption.isEggless ? ' | Eggless' : ''}`
            : (selectedOption ? selectedOption.size : '');
        const price = isCakeOption
            ? (() => {
                const perKg = selectedOption.isCustomized
                    ? (product.cakePricing?.customizationPricePerKg ?? product.cakePricing?.basePricePerKg ?? 0)
                    : (product.cakePricing?.basePricePerKg ?? 0);
                const eggless = selectedOption.isEggless ? (product.cakePricing?.egglessExtraCharge ?? 100) : 0;
                return perKg * selectedOption.weight + eggless;
            })()
            : (selectedOption ? selectedOption.price : (product.displayPrice || product.price));
        const customizationPayload = isCakeOption
            ? {
                weight: selectedOption.weight,
                isCustomized: selectedOption.isCustomized,
                isEggless: selectedOption.isEggless,
                customizationDetails: selectedOption.customizationDetails || {}
            }
            : sizeLabel;

        // Optimistic Update
        const newItem = {
            key: isAuthenticated ? 'temp-' + Date.now() : `${product._id}-${sizeLabel}`,
            id: product._id,
            name: product.name,
            image: product.image,
            price: price,
            size: sizeLabel,
            customizationPayload,
            quantity: 1,
            description: product.description,
            isAvailable: true,
            brand: product.brand || 'teasntrees'
        };

        if (isAuthenticated) {
            try {
                const response = await cartService.addToCart(product._id, 1, customizationPayload);
                if (response.success && response.data) {
                    setCartItems(response.data.items.map(mapServerItemToUI));
                    setIsCartOpen(true);
                    toast.success("Added to cart");
                }
            } catch (error) {
                console.error("Add to cart failed", error);
                toast.error(error.response?.data?.message || "Failed to add to cart");
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
            const orderPayload = {
                ...checkoutData,
                items: cartItems.map(item => ({
                    product: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    customization: item.size || '',
                    weight: item.customizationPayload?.weight,
                    isCustomized: item.customizationPayload?.isCustomized,
                    isEggless: item.customizationPayload?.isEggless,
                    customizationDetails: item.customizationPayload?.customizationDetails || null
                }))
            };

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
