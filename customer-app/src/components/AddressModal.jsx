// Address Modal Component
// Manage user addresses (add, edit, delete, set default)

import { useState, useEffect } from 'react';
import addressService from '../services/addressService';
import './AddressModal.css';

const AddressModal = ({ isOpen, onClose, onAddressSelect, selectedAddressId }) => {
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        addressLine: '',
        location: { type: 'Point', coordinates: [0, 0] }
    });

    useEffect(() => {
        if (isOpen) {
            fetchAddresses();
        }
    }, [isOpen]);

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const response = await addressService.getAddresses();
            if (response.success && response.data) {
                setAddresses(response.data.addresses || response.data || []);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCaptureLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    location: { type: 'Point', coordinates: [longitude, latitude] }
                }));
                setIsFetchingLocation(false);
                alert('GPS location captured successfully!');
            },
            (error) => {
                console.error('Error getting location:', error);
                setIsFetchingLocation(false);
                alert('Unable to retrieve your location. Please ensure location services are enabled.');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();

        try {
            await addressService.addAddress(formData);
            setFormData({ label: '', addressLine: '', location: { type: 'Point', coordinates: [0, 0] } });
            setIsAdding(false);
            fetchAddresses();
        } catch (error) {
            console.error('Error adding address:', error);
            alert('Failed to add address. Please try again.');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            await addressService.deleteAddress(addressId);
            fetchAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Failed to delete address. Please try again.');
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            await addressService.setDefaultAddress(addressId);
            fetchAddresses();
        } catch (error) {
            console.error('Error setting default address:', error);
            alert('Failed to set default address. Please try again.');
        }
    };

    const handleSelectAddress = (address) => {
        onAddressSelect(address);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="address-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Delivery Addresses</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading addresses...</p>
                        </div>
                    ) : (
                        <>
                            {!isAdding && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setIsAdding(true)}
                                >
                                    + Add New Address
                                </button>
                            )}

                            {isAdding && (
                                <form className="address-form" onSubmit={handleAddAddress}>
                                    <div className="form-group">
                                        <label>Label (e.g., Home, Office)</label>
                                        <input
                                            type="text"
                                            name="label"
                                            className="form-input"
                                            value={formData.label}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Address</label>
                                        <textarea
                                            name="addressLine"
                                            className="form-textarea"
                                            value={formData.addressLine}
                                            onChange={handleChange}
                                            rows="3"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${formData.location?.coordinates[0] !== 0 ? 'btn-success' : 'btn-outline'}`}
                                            onClick={handleCaptureLocation}
                                            disabled={isFetchingLocation}
                                            style={{ marginTop: 'var(--spacing-xs)', width: '100%' }}
                                        >
                                            {isFetchingLocation ? '⌛ Fetching...' : formData.location?.coordinates[0] !== 0 ? '✅ GPS Captured' : '📍 Capture Current GPS'}
                                        </button>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => setIsAdding(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary btn-sm">
                                            Save Address
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="addresses-list">
                                {addresses.length === 0 ? (
                                    <p className="empty-message">No addresses saved yet.</p>
                                ) : (
                                    addresses.map((address) => (
                                        <div
                                            key={address._id}
                                            className={`address-card ${selectedAddressId === address._id ? 'selected' : ''}`}
                                        >
                                            <div className="address-content">
                                                <div className="address-header">
                                                    <strong>{address.label}</strong>
                                                    {address.isDefault && (
                                                        <span className="badge badge-success">Default</span>
                                                    )}
                                                </div>
                                                <p className="address-text">{address.addressLine}</p>
                                            </div>

                                            <div className="address-actions">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleSelectAddress(address)}
                                                >
                                                    Select
                                                </button>
                                                {!address.isDefault && (
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleSetDefault(address._id)}
                                                    >
                                                        Set Default
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleDeleteAddress(address._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressModal;
