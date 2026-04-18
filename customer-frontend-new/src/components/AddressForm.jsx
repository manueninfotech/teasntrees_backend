import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, MapPin, Search, Navigation, Info } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from '@react-google-maps/api';
import { cn } from '../lib/utils';

const mapContainerStyle = {
    width: '100%',
    height: '250px',
    borderRadius: '16px'
};

const defaultCenter = {
    lat: 12.9716, // Bangalore default
    lng: 77.5946
};

// Custom Map Styles (Silver theme for premium look)
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
        {
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }]
        },
        {
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#616161" }]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#f5f5f5" }]
        },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#bdbdbd" }]
        },
        {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{ "color": "#eeeeee" }]
        },
        {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{ "color": "#e5e5e5" }]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9e9e9e" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#ffffff" }]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#dadada" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#616161" }]
        },
        {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9e9e9e" }]
        },
        {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [{ "color": "#e5e5e5" }]
        },
        {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [{ "color": "#eeeeee" }]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#c9c9c9" }]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9e9e9e" }]
        }
    ]
};

const libraries = ['places'];

const AddressForm = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData = null, 
    theme, 
    isSaving = false 
}) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    const [formData, setFormData] = useState({
        tag: 'Home',
        flatNo: '',
        street: '',
        area: '',
        city: '',
        pincode: '',
        location: { lat: defaultCenter.lat, lng: defaultCenter.lng },
        isDefault: false
    });

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const autocompleteRef = useRef(null);

    // Initialize with initialData if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                tag: initialData.label || 'Home',
                flatNo: initialData.flatNo || '',
                street: initialData.street || '',
                area: initialData.area || '',
                city: initialData.city || '',
                pincode: initialData.pincode || '',
                location: initialData.location?.coordinates?.length === 2 
                    ? { lat: initialData.location.coordinates[1], lng: initialData.location.coordinates[0] }
                    : { lat: defaultCenter.lat, lng: defaultCenter.lng },
                isDefault: initialData.isDefault || false
            });
            
            if (initialData.location?.coordinates?.length === 2) {
                setMapCenter({ 
                    lat: initialData.location.coordinates[1], 
                    lng: initialData.location.coordinates[0] 
                });
            }
        } else {
            // Reset for new address
            setFormData({
                tag: 'Home',
                flatNo: '',
                street: '',
                area: '',
                city: '',
                pincode: '',
                location: { lat: defaultCenter.lat, lng: defaultCenter.lng },
                isDefault: false
            });
            setMapCenter(defaultCenter);
        }
    }, [initialData, isOpen]);

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const addressComponents = place.address_components || [];
            let streetName = '';
            let colony = '';
            let city = '';
            let pincode = '';
            let state = '';

            addressComponents.forEach(comp => {
                const types = comp.types;
                if (types.includes('route')) streetName = comp.long_name;
                if (types.includes('sublocality_level_1') || types.includes('neighborhood')) colony = comp.long_name;
                if (types.includes('locality')) city = comp.long_name;
                if (types.includes('postal_code')) pincode = comp.long_name;
                if (types.includes('administrative_area_level_1')) state = comp.long_name;
            });

            const newPos = { lat, lng };
            setMapCenter(newPos);
            setFormData(prev => ({
                ...prev,
                street: streetName || place.name || '',
                area: colony || '',
                city: city || '',
                pincode: pincode || '',
                location: newPos
            }));
        }
    };

    const handleMarkerDragEnd = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData(prev => ({
            ...prev,
            location: { lat, lng }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Construct the addressLine like the original app did
        const addressLine = `${formData.flatNo}, ${formData.street}, ${formData.area}, ${formData.city} - ${formData.pincode}`;
        
        onSave({
            label: formData.tag,
            addressLine,
            flatNo: formData.flatNo,
            street: formData.street,
            area: formData.area,
            city: formData.city,
            pincode: formData.pincode,
            isDefault: formData.isDefault,
            location: {
                type: 'Point',
                coordinates: [formData.location.lng, formData.location.lat] // GeoJSON is [lng, lat]
            }
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={cn(
                        "w-full max-w-2xl overflow-hidden shadow-2xl rounded-[32px] border",
                        theme.isLittleH ? "bg-bakery-bg border-bakery-accent/20" : "bg-white border-white"
                    )}
                >
                    <div className="p-6 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl", theme.isLittleH ? "bg-bakery-accent/10 text-[#565A47]" : "bg-cafe-emerald/10 text-cafe-emerald")}>
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h2 className={cn("text-xl font-bold text-slate-800", theme.isLittleH && "font-playfair")}>
                                {initialData ? 'Edit Address' : 'Add New Address'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {/* Map Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exact Location on Map</label>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Drag the pin to your exact door
                                </span>
                            </div>
                            
                            {isLoaded ? (
                                <div className="relative group">
                                    <Autocomplete
                                        onLoad={ref => autocompleteRef.current = ref}
                                        onPlaceChanged={onPlaceChanged}
                                    >
                                        <div className="absolute top-3 left-3 right-3 z-10">
                                            <div className="relative flex items-center">
                                                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search your area, building or colony..."
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg focus:ring-2 focus:ring-cafe-emerald/50 outline-none text-sm"
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                />
                                            </div>
                                        </div>
                                    </Autocomplete>

                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={mapCenter}
                                        zoom={15}
                                        options={mapOptions}
                                    >
                                        <Marker
                                            position={formData.location}
                                            draggable={true}
                                            onDragEnd={handleMarkerDragEnd}
                                            animation={2} // DROP
                                        />
                                    </GoogleMap>
                                </div>
                            ) : (
                                <div className="w-full h-[250px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                    {loadError ? 'Error loading maps' : 'Loading Map...'}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Save As</label>
                                <select
                                    value={formData.tag}
                                    onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                >
                                    <option>Home</option>
                                    <option>Work</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flat / House No</label>
                                <input
                                    type="text"
                                    value={formData.flatNo}
                                    onChange={e => setFormData({ ...formData, flatNo: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                    placeholder="e.g. A-101"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street / Colony</label>
                            <input
                                type="text"
                                value={formData.street}
                                onChange={e => setFormData({ ...formData, street: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                placeholder="Auto-filled from map or type here"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Area</label>
                                <input
                                    type="text"
                                    value={formData.area}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl border-none focus:ring-2 ${theme.isLittleH ? 'bg-[#FDF5EC] focus:ring-[#565A47]/30' : 'bg-slate-50 focus:ring-cafe-emerald/50'}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                className={cn(
                                    "w-5 h-5 rounded border-slate-300",
                                    theme.isLittleH ? "text-[#565A47] focus:ring-[#565A47]" : "text-cafe-emerald focus:ring-cafe-emerald"
                                )}
                            />
                            <label htmlFor="isDefault" className="text-sm font-medium text-slate-700 cursor-pointer">
                                Set as default delivery address
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={cn(
                                "w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4",
                                theme.isLittleH ? "bg-[#565A47] hover:bg-[#3f4233]" : "bg-cafe-emerald hover:bg-cafe-teal",
                                isSaving && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Save Address
                                    <Save className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddressForm;
