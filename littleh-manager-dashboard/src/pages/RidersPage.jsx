import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Bike, Search, Star, Phone, MapPin,
    MoreVertical, CheckCircle, XCircle, Clock, ExternalLink
} from 'lucide-react';
import api from '../utils/api';
import { useRefresh } from '../context/RefreshContext';
import RiderDetailsModal from '../components/RiderDetailsModal';

export default function RidersPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'littleh';
    const { tick, bump } = useRefresh();

    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRider, setSelectedRider] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'

    const fetchRiders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/riders');
            setRiders(response.data.data || []);
        } catch (error) {
            console.error('Error fetching riders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiders();
    }, [tick, b]);

    const handleOpenModal = (rider) => {
        setSelectedRider(rider);
        setIsModalOpen(true);
    };

    const filteredRiders = riders.filter(rider => {
        const matchesSearch = rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rider.mobile?.includes(searchTerm);
        const matchesTab = activeTab === 'active' ? rider.isApproved : !rider.isApproved;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">Delivery Fleet</h1>
                    <p className="text-bakery-accent mt-1 font-bold uppercase text-[10px] tracking-widest">Rider Management</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-bakery-light/30 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-bakery-primary shadow-sm' : 'text-bakery-accent hover:text-bakery-primary'}`}
                    >
                        Active Fleet ({riders.filter(r => r.isApproved).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-bakery-primary text-white shadow-lg' : 'text-bakery-accent hover:text-bakery-primary'}`}
                    >
                        Applications ({riders.filter(r => !r.isApproved).length})
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-accent" />
                    <input
                        type="text"
                        placeholder="Search riders by name or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-12"
                    />
                </div>
            </div>

            {/* Riders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRiders.map((rider) => (
                    <div key={rider._id} className="card group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-bakery-light rounded-2xl flex items-center justify-center text-bakery-primary relative">
                                    <Bike className="w-8 h-8" />
                                    {rider.isOnline && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-bakery-primary uppercase tracking-tight truncate">{rider.name}</h3>
                                    <div className="flex items-center gap-1 text-orange-500 mt-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-[10px] font-black">{rider.averageRating?.toFixed(1) || '5.0'}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleOpenModal(rider)}
                                className="p-2 hover:bg-bakery-light rounded-lg transition-colors text-bakery-accent"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-bakery-accent bg-bakery-light/30 p-3 rounded-xl">
                                <Phone className="w-4 h-4" />
                                <span className="text-xs font-bold">{rider.mobile}</span>
                            </div>
                            <div className="flex items-center justify-between text-bakery-accent bg-bakery-light/30 p-3 rounded-xl group/loc">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">
                                        {rider.currentLocation?.coordinates?.[1] ? `${rider.currentLocation.coordinates[1].toFixed(4)}, ${rider.currentLocation.coordinates[0].toFixed(4)}` : 'Location Unknown'}
                                    </span>
                                </div>
                                {rider.currentLocation?.coordinates?.[1] && (
                                    <a
                                        href={`https://www.google.com/maps?q=${rider.currentLocation.coordinates[1]},${rider.currentLocation.coordinates[0]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 hover:text-bakery-primary transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-bakery-light">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-bakery-accent uppercase tracking-widest mb-1">Delivered</p>
                                <p className="text-lg font-black text-bakery-primary">{rider.totalDeliveries || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-bakery-accent uppercase tracking-widest mb-1">Status</p>
                                {!rider.isApproved ? (
                                    <p className="text-[10px] font-black text-amber-600 uppercase flex items-center justify-center gap-1.5 bg-amber-50 py-1 rounded-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Pending
                                    </p>
                                ) : (
                                    <p className={`text-[10px] font-black uppercase flex items-center justify-center gap-1.5 ${rider.isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {rider.isOnline ? (
                                            <>
                                                <div className={`w-1.5 h-1.5 rounded-full ${rider.isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                {rider.isBusy ? 'Busy' : 'Available'}
                                            </>
                                        ) : (
                                            'Offline'
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <RiderDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rider={selectedRider}
                onUpdate={bump}
            />
        </div>
    );
}
