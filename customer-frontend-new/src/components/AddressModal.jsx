
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check } from 'lucide-react';
import { userService } from '../services/userService';
import clsx from 'clsx';
import { cn } from '../lib/utils';
import { useBrand } from '../context/BrandContext';

const AddressModal = ({ isOpen, onClose, onSelect, selectedAddressId }) => {
    const { theme } = useBrand();
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

    if (theme.isLittleH) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50"
                    />

                    {/* Modal - white card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#8B8E7B]/15 flex justify-between items-center bg-[#FAF1E8]">
                            <h2 className="text-xl font-playfair font-bold text-[#565A47]">Select Address</h2>
                            <button onClick={onClose} className="p-2 hover:bg-[#FDF5EC] transition-colors">
                                <X className="w-5 h-5 text-[#565A47]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin w-8 h-8 border-2 border-[#565A47] border-t-transparent" />
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-8 text-[#8B8E7B]">
                                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-light">No saved addresses found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((addr) => (
                                        <button
                                            key={addr._id}
                                            onClick={() => handleSelect(addr)}
                                            className={clsx(
                                                "w-full text-left p-4 border-2 transition-all flex items-start gap-4 group",
                                                selectedAddressId === addr._id
                                                    ? "border-[#565A47] bg-[#FAF1E8]"
                                                    : "border-[#8B8E7B]/15 bg-white hover:border-[#565A47]/30 hover:bg-[#FAF1E8]/50"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-9 h-9 flex items-center justify-center flex-shrink-0 transition-colors",
                                                selectedAddressId === addr._id
                                                    ? "bg-[#565A47] text-[#FAF1E8]"
                                                    : "bg-[#FDF5EC] text-[#8B8E7B] group-hover:bg-[#565A47] group-hover:text-[#FAF1E8]"
                                            )}>
                                                {selectedAddressId === addr._id ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#565A47] mb-0.5 text-sm uppercase tracking-wider">{addr.label || "Address"}</p>
                                                <p className="text-sm text-[#8B8E7B] leading-relaxed font-light">{addr.addressLine}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#8B8E7B]/15 bg-[#FAF1E8]">
                            <p className="text-xs text-[#8B8E7B]">
                                To add a new address, use "Detect My Location" or type manually in the checkout form.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 transition-opacity"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">Select Address</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className={`animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full`} />
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
                                            selectedAddressId === addr._id
                                                ? "bg-emerald-500 text-white"
                                                : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
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

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
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
