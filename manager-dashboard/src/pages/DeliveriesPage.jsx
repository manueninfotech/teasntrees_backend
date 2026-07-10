import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    Navigation,
    MapPin,
    Bike,
    Clock,
    CheckCircle,
    User,
    ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useRefresh } from '../context/RefreshContext';

// --- Icon Fix for React Leaflet ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const riderIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Placeholder bike icon
    iconSize: [32, 32],
    className: 'animate-pulse'
});

const teasntreesIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/fluency/96/tea-cup.png', // Vibrant Tea icon
    iconSize: [40, 40],
    className: 'drop-shadow-md'
});

const littlehIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/fluency/96/birthday-cake.png', // Vibrant Cake icon
    iconSize: [40, 40],
    className: 'drop-shadow-md'
});

const customerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64572.png', // User icon
    iconSize: [28, 28]
});

// --- Map Controller to handle centering ---
const MapController = ({ selectedDelivery }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedDelivery && selectedDelivery.riderId?.currentLocation?.coordinates) {
            const [lng, lat] = selectedDelivery.riderId.currentLocation.coordinates;
            // L.latLng takes (lat, lng), Mongo stores [lng, lat]
            map.flyTo([lat, lng], 15, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedDelivery, map]);

    return null;
};

const DeliveriesPage = () => {
    const { token } = useAuth();
    const { socket } = useSocket();
    const { tick } = useRefresh();

    // State
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const initialLoadRef = useRef(true);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    // Default Shop Location (Little H Teas n Trees - Guntur)
    const SHOP_LOCATION = [16.3067, 80.4365]; // Guntur Coordinates

    // Fetch Deliveries
    const fetchDeliveries = async () => {
        try {
            const res = await api.get('/manager/deliveries/active');
            if (res.data.success) {
                setDeliveries(res.data.data);
                if (res.data.data.length > 0) setSelectedDelivery(res.data.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch deliveries", err);
        } finally {
            setLoading(false);
            initialLoadRef.current = false;
        }
    };

    useEffect(() => {
        if (initialLoadRef.current) {
            setLoading(true);
        }
        fetchDeliveries();
    }, [token, tick]);

    // Socket Listeners for Real-time Location Updates
    useEffect(() => {
        if (!socket) return;

        socket.on('rider:location_update', (data) => {
            // data: { riderId, location: { lat, lng } }
            setDeliveries(prev => prev.map(d => {
                if (d.riderId?._id === data.riderId) {
                    return {
                        ...d,
                        riderId: {
                            ...d.riderId,
                            currentLocation: {
                                type: 'Point',
                                coordinates: [data.location.lng, data.location.lat]
                            }
                        }
                    };
                }
                return d;
            }));
        });

        // Also listen for status updates to add/remove deliveries from list
        socket.on('delivery:status_update', (data) => {
            // In a real app, logic to add/remove from active list
            // For now, simpler to refetch or just update status locally
            fetchDeliveries();
        });

        return () => {
            socket.off('rider:location_update');
            socket.off('delivery:status_update');
        };
    }, [socket]);

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden">
            {/* Left Sidebar: Delivery List */}
            <div className="w-1/3 min-w-[340px] flex flex-col bg-white/50 backdrop-blur-xl rounded-[2.5rem] border-2 border-gray-50 shadow-2xl shadow-gray-200/50 overflow-hidden z-10 transition-all">
                <div className="p-8 border-b-2 border-gray-50 bg-white/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] leading-none">Live Tracking</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                        <Navigation className="w-8 h-8 text-emerald-600 drop-shadow-sm" /> Live Fleet
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {deliveries.length} ACTIVE DELIVERIES
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <Bike className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No active deliveries</p>
                        </div>
                    ) : (
                        deliveries.map(delivery => (
                            <motion.div
                                key={delivery._id}
                                layoutId={delivery._id}
                                onClick={() => setSelectedDelivery(delivery)}
                                className={`p-6 rounded-[2rem] cursor-pointer border-2 transition-all relative overflow-hidden group
                                    ${selectedDelivery?._id === delivery._id
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-200 scale-105 z-10'
                                        : 'bg-white border-gray-50 hover:border-emerald-600/20 hover:bg-emerald-50/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-0.5">
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border
                                            ${selectedDelivery?._id === delivery._id ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-gray-50 border-gray-100 text-emerald-600'}
                                        `}>
                                            #{delivery.orderId?.orderNumber || '0000'}
                                        </span>
                                        <h3 className={`font-black uppercase tracking-tighter text-sm mt-1.5 ${selectedDelivery?._id === delivery._id ? 'text-white' : 'text-gray-900'}`}>
                                            {delivery.customerId?.name || 'GUEST'}
                                        </h3>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm
                                        ${selectedDelivery?._id === delivery._id
                                            ? 'bg-white text-emerald-600 border-white'
                                            : 'bg-blue-50 text-blue-700 border-blue-100'}
                                    `}>
                                        {delivery.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between gap-3 mt-4 pt-4 border-t ${selectedDelivery?._id === delivery._id ? 'border-white/10' : 'border-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner ${selectedDelivery?._id === delivery._id ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            <Bike className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDelivery?._id === delivery._id ? 'text-emerald-50' : 'text-gray-600'}`}>
                                            {delivery.riderId?.name}
                                        </span>
                                    </div>
                                    {delivery.pickupOtp && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${selectedDelivery?._id === delivery._id ? 'bg-white/20 border-white/20 text-white' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                            Pickup OTP: {delivery.pickupOtp}
                                        </span>
                                    )}
                                </div>

                                {selectedDelivery?._id === delivery._id && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"
                                    >
                                        <Navigation className="w-12 h-12 rotate-90" />
                                    </motion.div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side: Map */}
            <div className="flex-1 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative">
                <MapContainer
                    center={SHOP_LOCATION}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    <MapController selectedDelivery={selectedDelivery} />

                    {/* Outlet Markers */}
                    {[
                        { name: 'Teas N Trees (LaxmiPuram)', position: [16.3090654, 80.4309655], icon: teasntreesIcon },
                        { name: 'LittleH Bakery (Amaravathi Road)', position: [16.314207, 80.4187407], icon: littlehIcon }
                    ].map(outlet => (
                        <Marker key={outlet.name} position={outlet.position} icon={outlet.icon}>
                            <Popup>
                                <div className="font-bold">{outlet.name}</div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Rider Markers */}
                    {deliveries.map(delivery => {
                        const riderLoc = delivery.riderId?.currentLocation?.coordinates;
                        if (!riderLoc) return null;

                        // Mongo: [lng, lat] -> Leaflet: [lat, lng]
                        const position = [riderLoc[1], riderLoc[0]];

                        return (
                            <Marker
                                key={`rider-${delivery._id}`}
                                position={position}
                                icon={riderIcon}
                            >
                                <Popup>
                                    <div className="text-xs">
                                        <p className="font-bold">{delivery.riderId?.name}</p>
                                        <p>Order #{delivery.orderId?.orderNumber}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Customer Marker (Only for selected) */}
                    {selectedDelivery && selectedDelivery.deliveryLocation?.coordinates && (
                        <Marker
                            position={[
                                selectedDelivery.deliveryLocation.coordinates[1],
                                selectedDelivery.deliveryLocation.coordinates[0]
                            ]}
                            icon={customerIcon}
                        >
                            <Popup>
                                <div className="text-xs font-bold">Customer Location</div>
                            </Popup>
                        </Marker>
                    )}

                </MapContainer>

                {/* Map Legend / Overlay Info */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100/50 z-[400] text-[10px] space-y-3 min-w-[140px]">
                    <div className="flex items-center gap-3">
                        <img src="https://img.icons8.com/fluency/96/tea-cup.png" className="w-5 h-5" alt="TnT" />
                        <span className="font-bold text-gray-800 tracking-tight">TEAS N TREES</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <img src="https://img.icons8.com/fluency/96/birthday-cake.png" className="w-5 h-5" alt="LH" />
                        <span className="font-bold text-gray-800 tracking-tight">LITTLEH BAKERY</span>
                    </div>
                    <div className="h-[1px] bg-gray-100 my-1" />
                    <div className="flex items-center gap-2.5">
                        <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" className="w-4 h-4" alt="Rider" />
                        <span className="font-bold text-gray-700">Rider</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <img src="https://cdn-icons-png.flaticon.com/512/64/64572.png" className="w-4 h-4" alt="Customer" />
                        <span className="font-bold text-gray-700">Customer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveriesPage;
