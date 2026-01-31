
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Plus, Check } from 'lucide-react';
import { userService } from '../services/userService';
import clsx from 'clsx';

const AddressModal = ({ isOpen, onClose, onSelect, selectedAddressId }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'add'

    // Fetch addresses on open
    useEffect(() => {
        if (isOpen) {
            fetchAddresses();
        }
    }, [isOpen]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const data = await userService.getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (addr) => {
        onSelect(addr);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-800">Select Address</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No saved addresses found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {addresses.map((addr) => (
                                    <button
                                        key={addr._id}
                                        onClick={() => handleSelect(addr)}
                                        className={clsx(
                                            "w-full text-left p-4 rounded-xl border-2 transition flex items-start gap-4 group",
                                            selectedAddressId === addr._id
                                                ? "border-emerald-500 bg-emerald-50"
                                                : "border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition",
                                            selectedAddressId === addr._id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                        )}>
                                            {selectedAddressId === addr._id ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 mb-0.5">{addr.label || "Address"}</p>
                                            <p className="text-sm text-slate-500 leading-relaxed">{addr.addressLine}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer - Only strictly for selection as requested, adding new is done via main form for simplicity now */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                        <p className="text-xs text-slate-400">
                            To add a new address, select "Use My Location" or type manually in the checkout form.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddressModal;
