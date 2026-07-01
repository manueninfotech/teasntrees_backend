import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import { userService } from '../services/userService';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { brand } = useBrand();
    const [wishlistItems, setWishlistItems] = useState([]);

    // We no longer rely solely on localStorage for initial state to avoid brand leakage
    // unless we use brand-specific keys. For now, let's just fetch from backend/refresh on brand change.

    // Sync with backend on login
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const items = await userService.getWishlist();
                setWishlistItems(items || []);
            } catch (error) {
                console.error("Failed to fetch wishlist", error);
            }
        };

        if (isAuthenticated) {
            fetchWishlist();
        } else {
            // On logout or guest session, clear the wishlist items to ensure no leakage
            setWishlistItems([]);
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
