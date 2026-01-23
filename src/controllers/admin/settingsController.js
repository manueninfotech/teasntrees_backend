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
            serviceAreas,
            riderBaseEarning,
            distanceBonusPerKm,
            contactPhone,
            contactEmail,
            address,
            operatingHours,
            socialMedia
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
            if (serviceAreas !== undefined) settings.serviceAreas = serviceAreas;
            if (riderBaseEarning !== undefined) settings.riderBaseEarning = riderBaseEarning;
            if (distanceBonusPerKm !== undefined) settings.distanceBonusPerKm = distanceBonusPerKm;
            if (contactPhone !== undefined) settings.contactPhone = contactPhone;
            if (contactEmail !== undefined) settings.contactEmail = contactEmail;
            if (address !== undefined) settings.address = address;
            if (operatingHours !== undefined) settings.operatingHours = operatingHours;
            if (socialMedia !== undefined) settings.socialMedia = socialMedia;

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

// Get delivery zones (mapped to serviceAreas)
export const getDeliveryZones = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.serviceAreas) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        res.status(200).json({
            success: true,
            data: settings.serviceAreas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery zones',
            error: error.message
        });
    }
};

// update delivery zones (mapped to serviceAreas)
export const updateDeliveryZones = async (req, res) => {
    try {
        const { serviceAreas } = req.body; // Expect serviceAreas in body now

        if (!Array.isArray(serviceAreas)) {
            return res.status(400).json({
                success: false,
                message: 'Service areas must be an array'
            });
        }

        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({ serviceAreas });
        } else {
            settings.serviceAreas = serviceAreas;
            await settings.save();
        }

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('manager', 'delivery-zones:updated', {
                zonesCount: serviceAreas.length
            });
            socketService.notifyRole('admin', 'delivery-zones:updated', {
                zonesCount: serviceAreas.length
            });
            // Notify customers about new delivery zones
            socketService.notifyRole('customer', 'delivery-zones:updated', {
                message: 'Delivery zones have been updated'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Delivery zones updated successfully',
            data: settings.serviceAreas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating delivery zones',
            error: error.message
        });
    }
};