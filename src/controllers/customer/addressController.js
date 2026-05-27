// Address Controller
// Endpoint: /api/customer/address
// Role: 'customer' only

import mongoose from 'mongoose';
import Customer from '../../models/Customer.js';
import { sanitizeString } from '../../utils/validators.js';
import { geocodingService } from '../../services/geocodingService.js';

// User-specific address cache
const addressCache = new Map();
const CACHE_TTL = 30000; // 30 seconds for personal data is safe

const getCachedResponse = (userId) => {
    const key = userId.toString();
    const cached = addressCache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }
    return null;
};

const setCachedResponse = (userId, data) => {
    addressCache.set(userId.toString(), { data, timestamp: Date.now() });
};

export const clearAddressCache = (userId) => {
    if (userId) {
        addressCache.delete(userId.toString());
    } else {
        addressCache.clear();
    }
};

// Add a new address
const addAddress = async (req, res) => {
    try {

        const { label, addressLine, location, isDefault, flatNo, street, area, city, pincode } = req.body;
        const userId = req.user.userId;

        if (!label || !addressLine) {
            return res.status(400).json({
                success: false,
                message: "Label and Address Line are required"
            });
        }

        const addressId = new mongoose.Types.ObjectId();

        const newAddress = {
            _id: addressId,
            label: sanitizeString(label),
            addressLine: sanitizeString(addressLine),
            flatNo: flatNo || "",
            street: street || "",
            area: area || "",
            city: city || "",
            pincode: pincode || "",
            location: location || { type: "Point", coordinates: [0, 0] },
            isDefault: isDefault || false
        };

        // Save address immediately
        const updateResult = await Customer.updateOne(
            { _id: userId },
            { $push: { addresses: newAddress } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Background geocoding (non-blocking)
        setImmediate(async () => {
            try {

                const coords = await geocodingService.getCoordinates(newAddress.addressLine);

                if (coords) {

                    await Customer.updateOne(
                        { _id: userId, "addresses._id": addressId },
                        {
                            $set: {
                                "addresses.$.location": {
                                    type: "Point",
                                    coordinates: [coords.lng, coords.lat]
                                }
                            }
                        }
                    );

                }

            } catch (err) {
                console.warn("Background geocoding failed:", err.message);
            }
        });

        clearAddressCache(userId);

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            data: newAddress
        });

    } catch (error) {

        console.error("Error in addAddress:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add address"
        });

    }
};

// Get all addresses
const getAddresses = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check cache
        const cachedData = getCachedResponse(userId);
        if (cachedData) return res.status(200).json(cachedData);

        // Optimized query: Only select addresses and use .lean()
        const customer = await Customer.findById(userId)
            .select('addresses')
            .lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const responseData = {
            success: true,
            data: customer.addresses || []
        };

        // Cache the result
        setCachedResponse(userId, responseData);

        return res.status(200).json(responseData);

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
        const { label, addressLine, location, isDefault, flatNo, street, area, city, pincode } = req.body;
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

        if (flatNo !== undefined) address.flatNo = flatNo;
        if (street !== undefined) address.street = street;
        if (area !== undefined) address.area = area;
        if (city !== undefined) address.city = city;
        if (pincode !== undefined) address.pincode = pincode;

        // --- NEW: Try to geocode if address was updated and location is missing or default ---
        if (addressLine || (!address.location.coordinates || (address.location.coordinates[0] === 0 && address.location.coordinates[1] === 0))) {
            // Only geocode if coordinates are missing/default
            if (!address.location.coordinates || (address.location.coordinates[0] === 0 && address.location.coordinates[1] === 0)) {
                const coords = await geocodingService.getCoordinates(address.addressLine);
                if (coords) {
                    address.location = {
                        type: 'Point',
                        coordinates: [coords.lng, coords.lat]
                    };
                }
            }
        }

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

        // Invalidate cache
        clearAddressCache(userId);

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

        // Invalidate cache
        clearAddressCache(userId);

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

        // Invalidate cache
        clearAddressCache(userId);

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

// Reverse Geocode (Get address from coords)
const reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and Longitude are required'
            });
        }

        const addressData = await geocodingService.getAddress(lat, lng);

        if (!addressData) {
            return res.status(404).json({
                success: false,
                message: 'Address not found for these coordinates'
            });
        }

        return res.status(200).json({
            success: true,
            data: addressData
        });

    } catch (error) {
        console.error('Error in reverseGeocode:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reverse geocode'
        });
    }
};

export {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    reverseGeocode
};
