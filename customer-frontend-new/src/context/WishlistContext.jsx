import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import { userService } from '../services/userService';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { brand } = useBrand();
    // Initialize Wishlist from localStorage for persistence across brand switching (guest sessions)
    const getInitialWishlist = () => {
        try {
            const saved = localStorage.getItem('guest_wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch (err) {
            console.error("Failed to load wishlist from localStorage", err);
            return [];
        }
    };

    const [wishlistItems, setWishlistItems] = useState(getInitialWishlist);

    // Save Guest Wishlist to localStorage whenever it changes
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('guest_wishlist', JSON.stringify(wishlistItems));
        }
    }, [wishlistItems, isAuthenticated]);

    // Sync with backend on login
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                // Sync guest items from localStorage if any exist
                const guestItems = getInitialWishlist();
                if (guestItems.length > 0) {
                    for (const item of guestItems) {
                        try {
                            // The server expects productId
                            await userService.addToWishlist(item._id);
                        } catch (err) {
                            console.error("Failed to sync wishlist item to account", item.name, err);
                        }
                    }
                    // Clear guest storage after successful sync check
                    localStorage.removeItem('guest_wishlist');
                }

                // Fetch the final server-side source of truth
                const items = await userService.getWishlist();
                setWishlistItems(items || []);
            } catch (error) {
                console.error("Failed to fetch wishlist", error);
            }
        };

        if (isAuthenticated) {
            fetchWishlist();
        }
    }, [isAuthenticated]);


    const addToWishlist = async (product) => {
        // Optimistic Update
        setWishlistItems((prev) => {
            if (prev.find(item => item._id === product._id)) return prev;
            return [...prev, product];
        });

        if (isAuthenticated) {
            try {
                await userService.addToWishlist(product._id);
            } catch (err) {
                console.error("Failed to add to wishlist backend", err);
                // Revert if needed, but for wishlist it's okay to stay mostly optimistic
            }
        }
    };

    const removeFromWishlist = async (productId) => {
        // Optimistic Update
        setWishlistItems((prev) => prev.filter(item => item._id !== productId));

        if (isAuthenticated) {
            try {
                await userService.removeFromWishlist(productId);
            } catch (err) {
                console.error("Failed to remove from wishlist backend", err);
            }
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item._id === productId);
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product._id)) {
            removeFromWishlist(product._id);
            return false; // Removed
        } else {
            addToWishlist(product);
            return true; // Added
        }
    };

    const clearWishlist = () => {
        setWishlistItems([]);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            toggleWishlist,
            clearWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
