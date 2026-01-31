import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState(() => {
        try {
            const savedCommon = localStorage.getItem('wishlist');
            return savedCommon ? JSON.parse(savedCommon) : [];
        } catch (error) {
            console.error('Failed to load wishlist from local storage', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
        } catch (error) {
            console.error('Failed to save wishlist to local storage', error);
        }
    }, [wishlistItems]);

    const addToWishlist = (product) => {
        setWishlistItems((prev) => {
            if (prev.find(item => item._id === product._id)) return prev;
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems((prev) => prev.filter(item => item._id !== productId));
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
