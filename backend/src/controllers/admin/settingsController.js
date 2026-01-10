import Settings from '../../models/Settings.js';

// Get application settings
export const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        // create default settings if none exist
        if (!settings) {
            settings = await Settings.create({
                deliveryCharge: 20,
                maxDeliveryDistance: 10,
                taxRate: 5,
                gstRate: 5,
                minOrderAmount: 100
            });
        }
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
};

// Update application settings
export const updateSettings = async (req, res) => {
    try {
        const {
            deliveryCharge,
            maxDeliveryDistance,
            taxRate,
            gstRate,
            minOrderAmount,
            deliveryZones
        } = req.body;

        let settings = await Settings.findOne();

        if (!settings) {
            // Create new settings if none exist
            settings = await Settings.create(req.body);
        } else {
            // Update existing settings
            if (deliveryCharge !== undefined) settings.deliveryCharge = deliveryCharge;
            if (maxDeliveryDistance !== undefined) settings.maxDeliveryDistance = maxDeliveryDistance;
            if (taxRate !== undefined) settings.taxRate = taxRate;
            if (gstRate !== undefined) settings.gstRate = gstRate;
            if (minOrderAmount !== undefined) settings.minOrderAmount = minOrderAmount;
            if (deliveryZones !== undefined) settings.deliveryZones = deliveryZones;

            await settings.save();
        }

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('manager', 'settings:updated', {
                updatedFields: Object.keys(req.body)
            });
            socketService.notifyRole('admin', 'settings:updated', {
                updatedFields: Object.keys(req.body)
            });
        }

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message
        });
    }
};

// Get delivery zones
export const getDeliveryZones = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.deliveryZones) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        res.status(200).json({
            success: true,
            data: settings.deliveryZones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery zones',
            error: error.message
        });
    }
};

// update delivery zones
export const updateDeliveryZones = async (req, res) => {
    try {
        const { deliveryZones } = req.body;

        if (!Array.isArray(deliveryZones)) {
            return res.status(400).json({
                success: false,
                message: 'Delivery zones must be an array'
            });
        }

        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({ deliveryZones });
        } else {
            settings.deliveryZones = deliveryZones;
            await settings.save();
        }

        res.status(200).json({
            success: true,
            message: 'Delivery zones updated successfully',
            data: settings.deliveryZones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating delivery zones',
            error: error.message
        });
    }
};