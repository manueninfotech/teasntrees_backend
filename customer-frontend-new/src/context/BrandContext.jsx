import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const BrandContext = createContext();

export const useBrand = () => useContext(BrandContext);

export const BrandProvider = ({ children }) => {
    const location = useLocation();

    const [brand, setBrandState] = useState(() => {
        return localStorage.getItem('activeBrand') || 'teasntrees';
    });

    const setBrand = (newBrand) => {
        if (newBrand === 'teasntrees' || newBrand === 'littleh') {
            setBrandState(newBrand);
            localStorage.setItem('activeBrand', newBrand);

            // Sync with backend session if logged in
            if (localStorage.getItem('token')) {
                api.put('/customer/profile/preferences/brand', { brand: newBrand })
                    .catch(err => console.error("Pref sync failed", err));
            }
        }
    };

    // Listen for auth-triggered brand syncs
    useEffect(() => {
        const handleSync = () => {
            const syncedBrand = localStorage.getItem('activeBrand');
            if (syncedBrand && syncedBrand !== brand) {
                setBrandState(syncedBrand);
            }
        };
        window.addEventListener('brandSyncFromAuth', handleSync);
        return () => window.removeEventListener('brandSyncFromAuth', handleSync);
    }, [brand]);

    // Auto-detect brand from URL path
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/littleh')) {
            setBrand('littleh');
        } else if (path.startsWith('/teasntrees') || path === '/') {
            setBrand('teasntrees');
        }
    }, [location.pathname]);

    // Derived theme variables
    const theme = {
        isLittleH: brand === 'littleh',
        isTeasNTrees: brand === 'teasntrees',
        primaryColorClass: brand === 'littleh' ? 'bg-bakery-primary' : 'bg-cafe-emerald',
        primaryHoverClass: brand === 'littleh' ? 'hover:bg-bakery-accent' : 'hover:bg-emerald-700',
        textColorClass: brand === 'littleh' ? 'text-bakery-primary' : 'text-cafe-emerald',
        bgLightClass: brand === 'littleh' ? 'bg-bakery-light' : 'bg-emerald-50',
        gradientClass: brand === 'littleh' ? 'from-bakery-primary to-bakery-accent' : 'from-cafe-emerald to-cafe-teal',
        gradientHoverClass: brand === 'littleh' ? 'hover:shadow-bakery-primary/40' : 'hover:shadow-cafe-emerald/40',
        shadowClass: brand === 'littleh' ? 'shadow-bakery-primary/30' : 'shadow-cafe-emerald/30',
        brandName: brand === 'littleh' ? 'LittleH Bakery' : 'Teas N Trees',
    };

    return (
        <BrandContext.Provider value={{ brand, setBrand, theme }}>
            {children}
        </BrandContext.Provider>
    );
};
