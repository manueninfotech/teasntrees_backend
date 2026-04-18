import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Truck, Search, MapPin, Clock,
    ArrowRight, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import { useRefresh } from '../context/RefreshContext';

export default function DeliveriesPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'littleh';
    const { tick, bump } = useRefresh();

    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/deliveries');
            setDeliveries(response.data.data || []);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [tick, b]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">Delivery Database</h1>
                    <p className="text-bakery-accent mt-1 font-bold uppercase text-[10px] tracking-widest">Full delivery history</p>
                </div>
                <button
                    onClick={fetchDeliveries}
                    className="btn-primary flex items-center gap-3"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Refresh Tracking</span>
                </button>
            </div>

            {/* Tracking Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {deliveries.map((delivery) => (
                    <div key={delivery._id} className="card group overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Tracking visual side */}
                            <div className="md:w-1 whitespace-nowrap bg-bakery-light rounded-full min-h-[100px] relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-bakery-primary rounded-full shadow-lg border-4 border-white"></div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-lg border-4 border-white"></div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-1">Order Ref</span>
                                        <span className="text-lg font-black text-bakery-primary uppercase tracking-tight">#{delivery.orderId?.orderNumber || 'N/A'}</span>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${delivery.status === 'in_transit' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {delivery.status?.replace('_', ' ') || 'Unknown'}
                                    </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-bakery-light/30 rounded-2xl">
                                        <p className="text-[8px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Pickup Station
                                        </p>
                                        <p className="text-[10px] font-bold text-bakery-primary uppercase tracking-tight line-clamp-2">
                                            {delivery.pickupLocation?.address || (delivery.brand === 'littleh' ? 'LittleH Bakery (Amaravathi Road)' : 'Teas N Trees (Lakshmipuram)')}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-bakery-light/30 rounded-2xl">
                                        <p className="text-[8px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <ArrowRight className="w-3 h-3" /> Destination
                                        </p>
                                        <p className="text-[10px] font-bold text-bakery-primary uppercase tracking-tight line-clamp-2">
                                            {delivery.deliveryLocation?.address || 'Customer Address'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-bakery-light">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-bakery-primary text-white rounded-xl flex items-center justify-center">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-bakery-accent uppercase tracking-widest">ETA</span>
                                            <span className="text-xs font-black text-bakery-primary">15 MINS</span>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-bakery-light hover:bg-bakery-primary hover:text-white text-bakery-primary rounded-xl text-[10px] font-black uppercase transition-all">
                                        Track View
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {deliveries.length === 0 && (
                    <div className="xl:col-span-2 py-20 bg-white rounded-[3rem] border-2 border-dashed border-bakery-light flex flex-col items-center justify-center text-bakery-accent">
                        <Truck className="w-16 h-16 opacity-10 mb-4" />
                        <p className="font-black uppercase text-xs tracking-widest">No Deliveries Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
