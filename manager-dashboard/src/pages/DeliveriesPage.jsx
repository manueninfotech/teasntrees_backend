import { useState, useEffect } from 'react';
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
import { useSocket } from '../context/SocketContext';

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

const shopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1078/1078018.png', // Shop icon
    iconSize: [32, 32]
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

    // State
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    // Default Shop Location (Little H Teas n Trees - Guntur)
    const SHOP_LOCATION = [16.3067, 80.4365]; // Guntur Coordinates

    // Fetch Deliveries
    const fetchDeliveries = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/manager/deliveries/active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDeliveries(data.data);
                if (data.data.length > 0) setSelectedDelivery(data.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch deliveries", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [token]);

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
            <div className="w-1/3 min-w-[320px] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden z-10">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-brand-primary" /> Active Deliveries
                    </h2>
                    <p className="text-xs text-gray-500">{deliveries.length} riders on the road</p>
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
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedDelivery?._id === delivery._id
                                    ? 'bg-brand-primary/5 border-brand-primary/20 shadow-md ring-1 ring-brand-primary/10'
                                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">#{delivery.orderId?.orderNumber}</h3>
                                        <p className="text-xs text-gray-500">{delivery.customerId?.name}</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                        {delivery.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Bike className="w-3 h-3 text-gray-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">{delivery.riderId?.name}</span>
                                    </div>
                                </div>
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

                    {/* Shop Marker */}
                    <Marker position={SHOP_LOCATION} icon={shopIcon}>
                        <Popup>
                            <div className="font-bold">Teas N Trees (Kitchen)</div>
                        </Popup>
                    </Marker>

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
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100/50 z-[400] text-xs space-y-2">
                    <div className="flex items-center gap-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/1078/1078018.png" className="w-4 h-4" alt="Shop" />
                        <span>Shop</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" className="w-4 h-4" alt="Rider" />
                        <span>Rider</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/64/64572.png" className="w-4 h-4" alt="Customer" />
                        <span>Customer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveriesPage;
