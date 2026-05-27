import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const BrandContext = createContext();

export const useBrand = () => useContext(BrandContext);

export const BrandProvider = ({ children }) => {
    const location = useLocation();

    const [brand, setBrandState] = useState('teasntrees');

    // Auto-detect brand from URL path
    useEffect(() => {
        const path = location.pathname;
        const urlBrand = path.split('/')[1]?.toLowerCase();

        if (urlBrand === 'littleh' || urlBrand === 'teasntrees') {
            setBrandState(urlBrand);
        } else {
            // Default to teasntrees if no valid brand in URL
            setBrandState('teasntrees');
        }
    }, [location.pathname]);

    // setBrand is now mostly to handle programmatic navigation if needed
    const setBrand = (newBrand) => {
        // In the new system, we navigate to the new brand URL instead of just setting state
        if (newBrand && newBrand !== brand) {
            window.location.href = `/${newBrand}`;
        }
    };

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
