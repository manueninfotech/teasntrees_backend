import Settings from '../../models/Settings.js';

// Get public application settings
export const getPublicSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne({ brand: req.activeBrand });

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({
                brand: req.activeBrand,
                deliveryCharge: 20,
                maxDeliveryDistance: 10,
                taxRate: 5,
                gstRate: 5,
                minOrderAmount: 100
            });
        }

        // Return only safe public fields
        res.status(200).json({
            success: true,
            data: {
                deliveryCharge: settings.deliveryCharge,
                minOrderAmount: settings.minOrderAmount || settings.minimumOrderValue,
                taxRate: settings.taxPercentage,
                operatingHours: settings.operatingHours,
                contactPhone: settings.contactPhone,
                contactEmail: settings.contactEmail,
                address: settings.address,
                socialMedia: settings.socialMedia,
                maxDeliveryDistance: settings.maxDeliveryDistance
            }
        });
    } catch (error) {
        console.error('Error fetching public settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
};
