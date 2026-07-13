// Seasonal Product Utilities
// Handles season-based product availability logic


// Get current month (1-12)
export const getCurrentMonth = () => {
    return new Date().getMonth() + 1; // getMonth() returns 0-11, we need 1-12
};

// Check if a product is available in the current month
export const isProductInSeason = (product) => {
    // If product is not seasonal, it's always available
    if (!product.isSeasonal) {
        return true;
    }

    // If no available months specified, treat as always available
    if (!product.availableMonths || product.availableMonths.length === 0) {
        return true;
    }

    const currentMonth = getCurrentMonth();
    return product.availableMonths.includes(currentMonth);
};

// Filter products to only include those available in current season
export const filterSeasonalProducts = (products) => {
    return products.filter(product => isProductInSeason(product));
};

// Get month name from number
export const getMonthName = (month) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Invalid Month';
};

// Get short month name from number
export const getShortMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || 'Invalid';
};

// Format available months for display
export const formatAvailableMonths = (months) => {
    if (!months || months.length === 0) return 'None';
    if (months.length === 12) return 'All Year';

    const sortedMonths = [...months].sort((a, b) => a - b);
    return sortedMonths.map(m => getShortMonthName(m)).join(', ');
};

// Check if product will be out of season soon (within next 7 days)
export const isProductEndingSoon = (product) => {
    if (!product.isSeasonal || !product.availableMonths) {
        return false;
    }

    const currentMonth = getCurrentMonth();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    // Check if current month is available but next month is not
    return product.availableMonths.includes(currentMonth) &&
        !product.availableMonths.includes(nextMonth);
};
