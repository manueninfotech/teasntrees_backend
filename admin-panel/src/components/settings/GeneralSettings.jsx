import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, Mail, Clock, MapPin, DollarSign, Bike } from 'lucide-react';
import api from '../../utils/api';

const GeneralSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        // Default structure
        contactPhone: '',
        contactEmail: '',
        address: '',
        deliveryCharge: 20,
        maxDeliveryDistance: 10,
        minOrderAmount: 100,
        taxRate: 5,
        gstRate: 5,
        riderBaseEarning: 30,
        distanceBonusPerKm: 5,
        operatingHours: {
            monday: { open: '09:00', close: '22:00', isOpen: true },
            tuesday: { open: '09:00', close: '22:00', isOpen: true },
            wednesday: { open: '09:00', close: '22:00', isOpen: true },
            thursday: { open: '09:00', close: '22:00', isOpen: true },
            friday: { open: '09:00', close: '22:00', isOpen: true },
            saturday: { open: '09:00', close: '23:00', isOpen: true },
            sunday: { open: '09:00', close: '23:00', isOpen: true }
        },
        socialMedia: { facebook: '', instagram: '', twitter: '' }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            if (response.data.success) {
                // Merge with defaults to ensure all fields exist
                setSettings(prev => ({ ...prev, ...response.data.data }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        // Handle nested properties (e.g. socialMedia.facebook) handled separately if needed, 
        // but explicit flat fields are easier. 
        // For simple top levels:
        setSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleNestedChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleHoursChange = (day, field, value) => {
        setSettings(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                [day]: {
                    ...prev.operatingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.put('/admin/settings', settings);
            if (response.data.success) {
                alert('Settings updated successfully!');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Store Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Building className="w-5 h-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-800">Store Information</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                        <textarea
                            name="address"
                            rows="2"
                            value={settings.address || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                name="contactPhone"
                                value={settings.contactPhone || ''}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                                type="email"
                                name="contactEmail"
                                value={settings.contactEmail || ''}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fees & Taxes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-800">Fees & Limit Settings</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge (₹)</label>
                        <input
                            type="number"
                            name="deliveryCharge"
                            value={settings.deliveryCharge}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                        <input
                            type="number"
                            name="taxRate"
                            value={settings.taxRate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                        <input
                            type="number"
                            name="minOrderAmount"
                            value={settings.minOrderAmount}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                        <input
                            type="number"
                            name="gstRate"
                            value={settings.gstRate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Delivery Distance (KM)</label>
                        <input
                            type="number"
                            name="maxDeliveryDistance"
                            value={settings.maxDeliveryDistance}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                </div>
            </div>

            {/* Rider Earnings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Bike className="w-5 h-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-800">Rider Earning Logic</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Earning per Order (₹)</label>
                        <input
                            type="number"
                            name="riderBaseEarning"
                            value={settings.riderBaseEarning}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Distance Bonus (₹ per KM)</label>
                        <input
                            type="number"
                            name="distanceBonusPerKm"
                            value={settings.distanceBonusPerKm}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-800">Operating Hours</h2>
                </div>
                <div className="p-6">
                    <div className="grid gap-4">
                        {Object.entries(settings.operatingHours || {}).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-4">
                                <div className="w-28 font-medium capitalize text-gray-700">{day}</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={hours.open}
                                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                        className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                                    />
                                    <span className="text-gray-400">to</span>
                                    <input
                                        type="time"
                                        value={hours.close}
                                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                        className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                                    />
                                    <label className="flex items-center gap-2 ml-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hours.isOpen}
                                            onChange={(e) => handleHoursChange(day, 'isOpen', e.target.checked)}
                                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-600">Open</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-70"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
    );
};

export default GeneralSettings;
