import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
        }
    };

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
        primaryColorClass: brand === 'littleh' ? 'bg-pink-500' : 'bg-cafe-emerald',
        primaryHoverClass: brand === 'littleh' ? 'hover:bg-pink-600' : 'hover:bg-emerald-700',
        textColorClass: brand === 'littleh' ? 'text-pink-600' : 'text-cafe-emerald',
        bgLightClass: brand === 'littleh' ? 'bg-pink-50' : 'bg-emerald-50',
        gradientClass: brand === 'littleh' ? 'from-pink-400 to-rose-400' : 'from-cafe-emerald to-cafe-teal',
        gradientHoverClass: brand === 'littleh' ? 'hover:shadow-pink-400/40' : 'hover:shadow-cafe-emerald/40',
        shadowClass: brand === 'littleh' ? 'shadow-pink-400/30' : 'shadow-cafe-emerald/30',
        brandName: brand === 'littleh' ? 'LittleH Bakery' : 'Teas N Trees',
    };

    return (
        <BrandContext.Provider value={{ brand, setBrand, theme }}>
            {children}
        </BrandContext.Provider>
    );
};
