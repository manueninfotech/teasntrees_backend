// Middleware to handle multi-brand routing via URL params
// Extract :brand from URL, validate and set req.activeBrand

export const brandMiddleware = (req, res, next) => {
    const { brand } = req.params;
    const allowedBrands = ['littleh', 'teasntrees'];

    if (!brand) {
        return res.status(400).json({
            success: false,
            message: 'Brand identifier is required in the URL'
        });
    }

    if (!allowedBrands.includes(brand.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: `Invalid brand: ${brand}. Allowed brands are: ${allowedBrands.join(', ')}`
        });
    }

    req.activeBrand = brand.toLowerCase();
    next();
};
