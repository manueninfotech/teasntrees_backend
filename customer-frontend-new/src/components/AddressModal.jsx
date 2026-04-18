import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, Search, Navigation, Save, ArrowLeft, Loader2, Info } from 'lucide-react';
import { userService } from '../services/userService';
import clsx from 'clsx';
import { cn } from '../lib/utils';
import { useBrand } from '../context/BrandContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const defaultCenter = [16.3067, 80.4365]; // Guntur [lat, lng]

// --- Pure module-level helpers (no component state deps) ---

// Extract building/place name from the first comma-segment of the typed query
// e.g. "Sai Hostel, Brodipet, Guntur" → "Sai Hostel"
const extractPlaceFromQuery = (query) => {
    const firstSegment = query.split(',')[0].trim();
    return firstSegment.length <= 60 ? firstSegment : '';
};

// Fetch from Nominatim geocoding API
const nominatimFetch = async (q) => {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&namedetails=1&countrycodes=in`
    );
    return res.json();
};

// MapController — receives target and moves map + pin imperatively
const MapController = ({ target }) => {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo([target.lat, target.lng], 16, { animate: true, duration: 0.8 });
    }, [target, map]);
    return null;
};

// Helper component for map click events
const LocationMarker = ({ position, setPosition, onPinDrop, isReverseGeocoding }) => {
    useMapEvents({
        click(e) {
            if (isReverseGeocoding) return;
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
            if (onPinDrop) onPinDrop(newPos);
        }
    });
    return position ? <Marker position={position} opacity={isReverseGeocoding ? 0.5 : 1} /> : null;
};

const AddressModal = ({ isOpen, onClose, onSelect, selectedAddressId, initialView = 'list', onSaveSuccess, initialData = null }) => {
    const { theme, brand } = useBrand();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState(initialView); // 'list' or 'map'

    const [newAddress, setNewAddress] = useState({
        tag: 'Home',
        flatNo: '',
        street: '',
        area: '',
        city: '',
        pincode: '',
        location: { lat: defaultCenter[0], lng: defaultCenter[1] },
        isDefault: false
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [mapTarget, setMapTarget] = useState(null); // { lat, lng } — drives MapController
    const searchTimeoutRef = useRef(null);

    // Initialize with initialData if editing
    useEffect(() => {
        if (isOpen && initialData) {
            const loc = initialData.location?.coordinates || [];
            // coordinates is [lng, lat]
            const coords = (loc.length === 2)
                ? { lat: loc[1], lng: loc[0] }
                : { lat: defaultCenter[0], lng: defaultCenter[1] };

            setNewAddress({
                tag: initialData.label || 'Home',
                flatNo: initialData.flatNo || '',
                street: initialData.street || '',
                area: initialData.area || '',
                city: initialData.city || '',
                pincode: initialData.pincode || '',
                location: coords,
                isDefault: initialData.isDefault || false
            });
            setMapTarget({ lat: coords.lat, lng: coords.lng });
            setSearchQuery(initialData.addressLine || '');

            // AUTO-HEALING: If critical fields are missing, re-geocode to fill them
            if (!initialData.street || !initialData.area) {
                setTimeout(() => {
                    handleReverseGeocode(coords);
                }, 500); // Small delay to ensure state is ready
            }
        } else if (isOpen && !initialData) {
            // Reset for fresh Add
            setNewAddress({
                tag: 'Home', flatNo: '', street: '', area: '', city: '', pincode: '',
                location: { lat: defaultCenter[0], lng: defaultCenter[1] },
                isDefault: false
            });
            setMapTarget({ lat: defaultCenter[0], lng: defaultCenter[1] });
            setSearchQuery('');
        }
    }, [isOpen, initialData]);

    // Fetch addresses on open
    useEffect(() => {
        if (isOpen) {
            fetchAddresses();
            setView(initialView);
        }
    }, [isOpen, initialView]);

    // Handle view changes to trigger location detection
    useEffect(() => {
        if (view === 'map' && !initialData) {
            handleLocateMe();
        }
    }, [view, initialData]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const data = await userService.getAddresses();
            setAddresses(data || []);
        } catch (error) {
            console.error("Failed to fetch addresses", error);
            toast.error("Failed to load addresses");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (addr) => {
        onSelect(addr);
        onClose();
    };

    // Core search logic — wrapped in useCallback so useEffect always calls latest version
    const performSearch = useCallback(async (query, silent = false) => {
        if (!query || query.length < 3) return;
        setIsSearching(true);

        // Apply a Nominatim result to all address fields
        const applyResult = (topResult, originalQuery) => {
            const lat = parseFloat(topResult.lat);
            const lng = parseFloat(topResult.lon);
            const addr = topResult.address || {};
            const nameDetails = topResult.namedetails || {};

            const nominatimPlaceName =
                addr.amenity ||
                addr.hotel ||
                addr.office ||
                addr.shop ||
                addr.leisure ||
                addr.tourism ||
                addr.building ||
                addr.house_number ||
                nameDetails.name ||
                '';

            const placeName = nominatimPlaceName || extractPlaceFromQuery(originalQuery);

            // Move map and pin
            setMapTarget({ lat, lng });
            setNewAddress(prev => ({
                ...prev,
                flatNo: placeName || prev.flatNo,
                street: addr.road || addr.pedestrian || addr.path || addr.suburb || prev.street,
                area: addr.neighbourhood || addr.suburb || addr.residential || addr.city_district || prev.area,
                city: addr.city || addr.town || addr.village || addr.county || prev.city,
                pincode: addr.postcode || prev.pincode,
                location: { lat, lng }
            }));
        };

        try {
            // Try full query
            let data = await nominatimFetch(query);
            if (data && data.length > 0) {
                applyResult(data[0], query);
                return;
            }

            // Fallback — strip place name and retry with area/city
            // "Sri Sai Hostel, Brodipet, Guntur" → "Brodipet, Guntur" → "Guntur"
            const segments = query.split(',').map(s => s.trim());
            for (let i = 1; i < segments.length; i++) {
                const fallbackQuery = segments.slice(i).join(', ');
                if (fallbackQuery.length < 3) continue;
                data = await nominatimFetch(fallbackQuery);
                if (data && data.length > 0) {
                    applyResult(data[0], query);
                    if (!silent) toast.success(`Pinned to "${fallbackQuery}" — verify on the map.`);
                    return;
                }
            }

            // Nothing found
            if (!silent) toast.error("Location not found. Try adding area/city after a comma.");
        } catch (err) {
            console.error("Search error", err);
            if (!silent) toast.error("Search failed. Please try again.");
        } finally {
            setIsSearching(false);
        }
    }, [setIsSearching, setMapTarget, setNewAddress]);

    // Live search while typing — debounced 700ms, triggers at 4+ characters
    useEffect(() => {
        if (searchQuery.length < 4) return;
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(searchQuery, true);
        }, 700);
        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchQuery, performSearch]);

    // Compose search bar text from all form fields
    const composeSearchQuery = (updated) => {
        const parts = [
            updated.flatNo,
            updated.street,
            updated.area,
            updated.city
        ].filter(Boolean);
        return parts.join(', ');
    };

    // Called by Enter key or Search button — immediate, with toasts
    const handleSearch = () => performSearch(searchQuery.trim(), false);

    const handleSearchResultSelect = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const addr = result.address || {};

        setMapTarget({ lat, lng });

        // Extract robustly
        const firstPart = result.display_name?.split(',')[0] || '';
        const hasNumberInFirstPart = /\d/.test(firstPart);
        const houseNumber = addr.house_number || addr.building || addr.amenity || (hasNumberInFirstPart ? firstPart : '');

        const street = addr.road || addr.pedestrian || addr.path || addr.suburb || '';
        const area = addr.neighbourhood || addr.suburb || addr.residential || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const pincode = addr.postcode || '';

        setNewAddress(prev => ({
            ...prev,
            flatNo: houseNumber,
            street: street,
            area: area,
            city: city,
            pincode: pincode,
            location: { lat, lng }
        }));
        setSearchResults([]);
        setSearchQuery(result.display_name);
    };

    const handleReverseGeocode = async (pos) => {
        setIsReverseGeocoding(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&addressdetails=1`);
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;

                // Extract robustly
                const firstPart = data.display_name?.split(',')[0] || '';
                const hasNumberInFirstPart = /\d/.test(firstPart);
                const houseNumber = addr.house_number || addr.building || addr.amenity || (hasNumberInFirstPart ? firstPart : '');

                const street = addr.road || addr.pedestrian || addr.path || addr.suburb || '';
                const area = addr.neighbourhood || addr.suburb || addr.residential || addr.city_district || '';
                const city = addr.city || addr.town || addr.village || addr.county || '';
                const pincode = addr.postcode || '';

                setNewAddress(prev => ({
                    ...prev,
                    flatNo: houseNumber || prev.flatNo, // Keep existing if not found
                    street: street,
                    area: area,
                    city: city,
                    pincode: pincode,
                    location: pos
                }));
                setSearchQuery(data.display_name);
            }
        } catch (err) {
            console.error("Reverse geocode error", err);
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsReverseGeocoding(true);

        const successCallback = (position) => {
            const { latitude, longitude } = position.coords;
            const newPos = { lat: latitude, lng: longitude };
            setMapTarget(newPos);
            setNewAddress(prev => ({ ...prev, location: newPos }));
            handleReverseGeocode(newPos);
        };

        const errorCallback = (error) => {
            console.error("Location error", error);

            // Fallback for timeout or high accuracy failure: Try once more with highAccuracy disabled
            if (error.code === 3 || error.code === 0) {
                console.log("Retrying with lower accuracy...");
                navigator.geolocation.getCurrentPosition(successCallback, finalErrorCallback, {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 10000
                });
                return;
            }

            finalErrorCallback(error);
        };

        const finalErrorCallback = (error) => {
            setIsReverseGeocoding(false);
            if (error.code === 1) {
                toast.error("Location permission denied. Defaulting to city center.");
            } else {
                toast.error("Could not fetch your current location. Defaulting to city center.");
            }
        };

        navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };


    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const addressLine = `${newAddress.flatNo}, ${newAddress.street}, ${newAddress.area}, ${newAddress.city} - ${newAddress.pincode}`;
            const payload = {
                label: newAddress.tag,
                addressLine,
                flatNo: newAddress.flatNo,
                street: newAddress.street,
                area: newAddress.area,
                city: newAddress.city,
                pincode: newAddress.pincode,
                isDefault: newAddress.isDefault,
                location: {
                    type: 'Point',
                    coordinates: [newAddress.location.lng, newAddress.location.lat]
                }
            };

            if (initialData?._id) {
                await userService.updateAddress(initialData._id, payload);
                toast.success("Address updated!");
            } else {
                const response = await userService.addAddress(payload);
                toast.success("New address added!");
                if (onSelect && response) onSelect(response);
            }

            if (onSaveSuccess) onSaveSuccess();
            await fetchAddresses();
            setView('list');
        } catch (err) {
            console.error("Failed to save", err);
            toast.error("Error saving address");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // --- SHARED UI COMPONENTS (Map View Render Helper) ---
    const renderMapView = () => (
        <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme.isLittleH ? "text-[#565A47]/40" : "text-slate-400")} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                            placeholder="Search location and press Enter..."
                            className={cn(
                                "w-full pl-10 pr-4 py-3 rounded-xl border-none focus:ring-2 outline-none text-sm transition-all",
                                theme.isLittleH ? "bg-[#FDF5EC] focus:ring-[#565A47]/30 text-[#565A47]" : "bg-slate-50 focus:ring-emerald-500/50 text-slate-700"
                            )}
                        />
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); handleSearch(); }}
                        disabled={isSearching}
                        className={cn(
                            "flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5",
                            theme.isLittleH ? "bg-[#565A47] text-white hover:bg-[#3f4233]" : "bg-emerald-500 text-white hover:bg-emerald-600",
                            isSearching && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-[24px] overflow-hidden border border-slate-200 h-[220px]">
                <MapContainer center={defaultCenter} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapController target={mapTarget} />
                    <LocationMarker
                        position={newAddress.location}
                        setPosition={(pos) => setNewAddress({ ...newAddress, location: pos })}
                        onPinDrop={handleReverseGeocode}
                        isReverseGeocoding={isReverseGeocoding}
                    />
                </MapContainer>
                {isReverseGeocoding && (
                    <div className="absolute inset-0 z-[500] bg-white/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-white px-6 py-4 rounded-3xl shadow-xl flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                <span className="text-xs font-medium text-slate-600">Detecting current location...</span>
                            </div>
                            <button
                                onClick={() => setIsReverseGeocoding(false)}
                                className="text-[10px] text-slate-400 hover:text-red-500 underline transition-colors"
                            >
                                Use map manually
                            </button>
                        </div>
                    </div>
                )}
                <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleLocateMe();
                        }}
                        className="bg-white p-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 group"
                        title="Locate Me"
                    >
                        <Navigation className="w-4 h-4 text-emerald-600 group-active:scale-95 transition-transform" />
                    </button>
                </div>

                <div className="absolute bottom-3 left-3 z-[400]">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] text-slate-500 flex items-center gap-1 shadow-sm">
                        <Info className="w-3 h-3" /> Click map to pin exact door
                    </div>
                </div>
            </div>

            {/* Simplified Form */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-wider", theme.isLittleH ? "text-[#565A47]/50" : "text-slate-400")}>House/Flat No</label>
                    <input
                        type="text"
                        required
                        value={newAddress.flatNo}
                        onChange={(e) => {
                            const updated = { ...newAddress, flatNo: e.target.value };
                            setNewAddress(updated);
                            setSearchQuery(composeSearchQuery(updated));
                        }}
                        className={cn("w-full px-4 py-2.5 rounded-xl border-none text-sm", theme.isLittleH ? "bg-[#FDF5EC]" : "bg-slate-50")}
                        placeholder="e.g. A-101"
                    />
                </div>
                <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-wider", theme.isLittleH ? "text-[#565A47]/50" : "text-slate-400")}>Tag</label>
                    <select
                        value={newAddress.tag}
                        onChange={(e) => setNewAddress({ ...newAddress, tag: e.target.value })}
                        className={cn("w-full px-4 py-2.5 rounded-xl border-none text-sm", theme.isLittleH ? "bg-[#FDF5EC]" : "bg-slate-50")}
                    >
                        <option>Home</option>
                        <option>Work</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1 relative">
                <label className={cn("text-[10px] font-bold uppercase tracking-wider", theme.isLittleH ? "text-[#565A47]/50" : "text-slate-400")}>Detailed Address</label>
                <div className="relative flex items-center">
                    <input
                        type="text"
                        required
                        value={newAddress.street}
                        onChange={(e) => {
                            const updated = { ...newAddress, street: e.target.value };
                            setNewAddress(updated);
                            setSearchQuery(composeSearchQuery(updated));
                        }}
                        className={cn("w-full px-4 py-2.5 rounded-xl border-none text-sm", theme.isLittleH ? "bg-[#FDF5EC]" : "bg-slate-50")}
                        placeholder="Street/Colony"
                    />
                    {isSearching && searchQuery === '' && newAddress.street.length > 2 && (
                        <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-slate-400" />
                    )}
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                    "w-full py-4 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                    theme.isLittleH ? "bg-[#565A47] hover:bg-[#3f4233]" : "bg-emerald-500 hover:bg-emerald-600",
                    isSaving && "opacity-50"
                )}
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Address
            </button>
        </div>
    );

    // --- BRAND: LITTLE H ---
    if (theme.isLittleH) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden rounded-[40px]"
                    >
                        <div className="p-6 border-b border-[#8B8E7B]/15 flex justify-between items-center bg-[#FAF1E8]">
                            <div className="flex items-center gap-3">
                                {view === 'map' && (
                                    <button onClick={() => setView('list')} className="p-2 hover:bg-[#FDF5EC] rounded-full transition-colors text-[#565A47]">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <h2 className="text-xl font-playfair font-bold text-[#565A47]">
                                    {view === 'list' ? 'Select Address' : 'Add New Address'}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[#FDF5EC] transition-colors rounded-full">
                                <X className="w-5 h-5 text-[#565A47]" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[75vh] overflow-y-auto bg-white custom-scrollbar">
                            {view === 'list' ? (
                                <>
                                    {loading ? (
                                        <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-[#565A47]" /></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {addresses.map((addr) => (
                                                <button
                                                    key={addr._id}
                                                    onClick={() => handleSelect(addr)}
                                                    className={cn(
                                                        "w-full text-left p-4 border-2 transition-all flex items-start gap-4 group rounded-3xl",
                                                        selectedAddressId === addr._id ? "border-[#565A47] bg-[#FAF1E8]" : "border-[#8B8E7B]/10 hover:border-[#565A47]/30"
                                                    )}
                                                >
                                                    <div className={cn("w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all rounded-2xl", selectedAddressId === addr._id ? "bg-[#565A47] text-[#FAF1E8]" : "bg-[#FDF5EC] text-[#8B8E7B]")}>
                                                        {selectedAddressId === addr._id ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-[#565A47] text-xs uppercase tracking-widest">{addr.label || "Address"}</p>
                                                        <p className="text-sm text-[#8B8E7B] font-light leading-relaxed">{addr.addressLine}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setView('map')}
                                                className="w-full p-4 border-2 border-dashed border-[#8B8E7B]/20 rounded-3xl text-[#565A47] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FAF1E8]/50 transition-all"
                                            >
                                                <Navigation className="w-4 h-4" /> Add New Address
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : renderMapView()}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // --- BRAND: TEASNTREES (Default) ---
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            {view === 'map' && (
                                <button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-slate-200 transition text-slate-600">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h2 className="text-xl font-bold text-slate-800">
                                {view === 'list' ? 'Select Address' : 'Locate Address'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        {view === 'list' ? (
                            <>
                                {loading ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /></div>
                                ) : (
                                    <div className="space-y-3">
                                        {addresses.map((addr) => (
                                            <button
                                                key={addr._id}
                                                onClick={() => handleSelect(addr)}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 group",
                                                    selectedAddressId === addr._id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 hover:border-emerald-100 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all", selectedAddressId === addr._id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600")}>
                                                    {selectedAddressId === addr._id ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">{addr.label || "Address"}</p>
                                                    <p className="text-sm text-slate-500 leading-relaxed">{addr.addressLine}</p>
                                                </div>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setView('map')}
                                            className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-emerald-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all"
                                        >
                                            <Navigation className="w-4 h-4" /> Add New Address
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : renderMapView()}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddressModal;
