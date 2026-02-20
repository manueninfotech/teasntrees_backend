import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [wishlistItems, setWishlistItems] = useState(() => {
        try {
            const savedCommon = localStorage.getItem('wishlist');
            return savedCommon ? JSON.parse(savedCommon) : [];
        } catch (error) {
            console.error('Failed to load wishlist from local storage', error);
            return [];
        }
    });

    // Sync with backend on login
    useEffect(() => {
        if (isAuthenticated) {
            const fetchWishlist = async () => {
                try {
                    const items = await userService.getWishlist();
                    setWishlistItems(items || []);
                    localStorage.setItem('wishlist', JSON.stringify(items || []));
                } catch (error) {
                    // Gracefully fall back to local storage if sync fails
                }
            };
            fetchWishlist();
        }
    }, [isAuthenticated]);

    // Persist to local storage
    useEffect(() => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
        } catch (error) {
            console.error('Failed to save wishlist to local storage', error);
        }
    }, [wishlistItems]);

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
