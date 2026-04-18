// Middleware to handle multi-brand routing via URL params
// Extract :brand from URL, validate and set req.activeBrand

export const brandMiddleware = (req, res, next) => {
    const { brand } = req.params;
    const allowedBrands = ['littleh', 'teasntrees'];

    // If brand is missing from URL, try query or headers, otherwise default to teasntrees
    const activeBrand = (brand || req.query.brand || req.headers['x-brand'] || 'teasntrees').toLowerCase();

    if (!allowedBrands.includes(activeBrand)) {
        return res.status(400).json({
            success: false,
            message: `Invalid brand: ${activeBrand}. Allowed brands are: ${allowedBrands.join(', ')}`
        });
    }

    req.activeBrand = activeBrand;
    next();
};
