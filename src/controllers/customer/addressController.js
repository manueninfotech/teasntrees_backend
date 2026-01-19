// Address Controller
// Endpoint: /api/customer/address
// Role: 'customer' only

import Customer from '../../models/Customer.js';
import { sanitizeString } from '../../utils/validators.js';

// Add a new address
const addAddress = async (req, res) => {
    try {
        const { label, addressLine, location, isDefault } = req.body;
        const userId = req.user.userId;

        // Custom validation
        if (!label || !addressLine) {
            return res.status(400).json({
                success: false,
                message: 'Label and Address Line are required'
            });
        }

        const customer = await Customer.findById(userId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Create new address object
        const newAddress = {
            label: sanitizeString(label),
            addressLine: sanitizeString(addressLine),
            location: location || { type: 'Point', coordinates: [0, 0] },
            isDefault: isDefault || false
        };

        // If this is the first address, make it default automatically
        if (customer.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        // If new address is default, unset other defaults
        if (newAddress.isDefault) {
            customer.addresses.forEach(addr => addr.isDefault = false);
        }

        customer.addresses.push(newAddress);
        await customer.save();

        return res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: customer.addresses
        });

    } catch (error) {
        console.error('Error in addAddress:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add address'
        });
    }
};

// Get all addresses
const getAddresses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const customer = await Customer.findById(userId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: customer.addresses
        });

    } catch (error) {
        console.error('Error in getAddresses:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses'
        });
    }
};

// Update address
const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { label, addressLine, location, isDefault } = req.body;
        const userId = req.user.userId;

        const customer = await Customer.findById(userId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const address = customer.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        if (label) address.label = sanitizeString(label);
        if (addressLine) address.addressLine = sanitizeString(addressLine);
        if (location) address.location = location;

        if (isDefault !== undefined) {
            if (isDefault) {
                // If setting to true, unset others
                customer.addresses.forEach(addr => addr.isDefault = false);
                address.isDefault = true;
            } else {
                // Cannot unset default if it's the only one or if logic requires one default
                // For now allow unsetting, but usually you want one default.
                address.isDefault = false;
            }
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: customer.addresses
        });

    } catch (error) {
        console.error('Error in updateAddress:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update address'
        });
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.userId;

        const customer = await Customer.findById(userId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const address = customer.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        address.deleteOne(); // Mongoose subdocument removal
        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
            data: customer.addresses
        });

    } catch (error) {
        console.error('Error in deleteAddress:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete address'
        });
    }
};

// Set Default Address
const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.userId;

        const customer = await Customer.findById(userId);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const address = customer.addresses.id(addressId);
        if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

        // Unset all others
        customer.addresses.forEach(addr => addr.isDefault = false);
        address.isDefault = true;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Default address updated',
            data: customer.addresses
        });

    } catch (error) {
        console.error('Error in setDefaultAddress:', error);
        return res.status(500).json({ success: false, message: 'Failed to set default address' });
    }
}

export {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
