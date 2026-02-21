import { useState, useEffect } from 'react';
import api from '../utils/api';
import ProductModal from '../components/ProductModal';
import {
    Edit,
    Search,
    Calendar,
    Package,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Plus,
    X,
    Trash2,
    Save,
    RefreshCw,
    ArrowRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

const ProductSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-80"></div>
        ))}
    </div>
);

export default function SeasonalProducts() {
    const queryClient = useQueryClient();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('seasonal');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const [brandFilter, setBrandFilter] = useState(searchParams.get('brand') || '');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fetch Seasonal Products
    const { data: seasonalProducts = [], isLoading: seasonalLoading } = useQuery({
        queryKey: ['products-seasonal-all', brandFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (brandFilter) params.append('brand', brandFilter);
            const response = await api.get(`/admin/products/seasonal/all?${params.toString()}`);
            const data = response.data.data || [];
            localStorage.setItem(`products-seasonal-all-cache-${brandFilter}`, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem(`products-seasonal-all-cache-${brandFilter}`);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    // Fetch Out-of-Season Products
    const { data: outOfSeasonProducts = [], isLoading: outOfSeasonLoading } = useQuery({
        queryKey: ['products-seasonal-out-of-season', brandFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (brandFilter) params.append('brand', brandFilter);
            const response = await api.get(`/admin/products/seasonal/out-of-season?${params.toString()}`);
            const data = response.data.data || [];
            localStorage.setItem(`products-seasonal-out-of-season-cache-${brandFilter}`, JSON.stringify(data));
            return data;
        },
        initialData: () => {
            const cached = localStorage.getItem(`products-seasonal-out-of-season-cache-${brandFilter}`);
            return cached ? JSON.parse(cached) : undefined;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 0
    });

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] });
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-out-of-season'] });
        };
        socket.on('product:created', handleUpdate);
        socket.on('product:updated', handleUpdate);
        socket.on('product:deleted', handleUpdate);
        return () => {
            socket.off('product:created', handleUpdate);
            socket.off('product:updated', handleUpdate);
            socket.off('product:deleted', handleUpdate);
        };
    }, [socket, queryClient]);

    const deleteProduct = async (id) => {
        if (!window.confirm('Delete this seasonal item?')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] });
            queryClient.invalidateQueries({ queryKey: ['products-seasonal-out-of-season'] });
        } catch (error) { setError(error.response?.data?.message || 'Failed to delete'); }
    };

    const displayProducts = activeTab === 'seasonal' ? seasonalProducts : outOfSeasonProducts;
    const filteredProducts = displayProducts.filter(p => p?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const loading = seasonalLoading || outOfSeasonLoading;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Seasonal Items</h1>
                    <p className="text-gray-500 mt-1 font-bold">Manage items available only at certain times</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="input text-xs font-bold uppercase border-indigo-200 bg-indigo-50 text-indigo-700 h-[48px] rounded-2xl px-6"
                    >
                        <option value="">All Brands</option>
                        <option value="teasntrees">Teas N Trees</option>
                        <option value="littleh">LittleH Bakery</option>
                    </select>
                    <button
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] });
                            queryClient.invalidateQueries({ queryKey: ['products-seasonal-out-of-season'] });
                        }}
                        disabled={loading}
                        className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard label="Active Now" value={seasonalProducts.length} icon={Calendar} theme="green" desc="Visible to customers" loading={seasonalLoading} />
                <StatCard label="Off Season" value={outOfSeasonProducts.length} icon={AlertCircle} theme="orange" desc="Hidden from public" loading={outOfSeasonLoading} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-12 text-sm font-bold" />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button onClick={() => setActiveTab('seasonal')} className={`flex-1 px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'seasonal' ? 'text-green-600 bg-white border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>Active Seasonal ({seasonalProducts.length})</button>
                    <button onClick={() => setActiveTab('out-of-season')} className={`flex-1 px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'out-of-season' ? 'text-orange-600 bg-white border-b-2 border-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>Inactive ({outOfSeasonProducts.length})</button>
                </div>

                <div className="p-8">
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredProducts.map((product) => (
                                <div key={product._id} className="group bg-white rounded-[2rem] border-2 border-gray-50 overflow-hidden hover:shadow-2xl transition-all">
                                    <div className="h-44 flex items-center justify-center relative bg-gray-50">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <Package className="w-16 h-16 text-gray-200" />
                                        )}
                                        {activeTab === 'out-of-season' && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="text-[10px] font-black uppercase text-white bg-orange-600 px-4 py-2 rounded-xl shadow-lg">Not in season</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase truncate text-sm">{product.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold line-clamp-1">{product.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-black text-gray-900">₹{product.price}</span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{product.isAvailable ? 'Live' : 'Hidden'}</span>
                                        </div>
                                        {product.availableMonths && (
                                            <div className="flex flex-wrap gap-1">
                                                {product.availableMonths.map((month) => (
                                                    <span key={month} className="text-[8px] font-black uppercase px-2 py-1 bg-gray-100 text-gray-400 rounded-md">{monthNames[month - 1]}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-4">
                                            <button onClick={() => navigate(`/products/${product._id}`)} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">View</button>
                                            <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Edit</button>
                                            <button onClick={() => deleteProduct(product._id)} className="px-4 py-3 bg-red-50 text-red-300 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 text-gray-200 font-black uppercase tracking-widest">
                            <Calendar className="w-20 h-20 mx-auto mb-4 opacity-20" />
                            <h3>No matching items</h3>
                        </div>
                    )}
                </div>
            </div>

            <ProductModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProduct(null); }} product={editingProduct} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products-seasonal-all'] })} />
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, theme, desc, loading }) => {
    const themes = {
        green: 'from-emerald-500 to-green-600 shadow-green-100 text-green-600 bg-green-50',
        orange: 'from-orange-500 to-amber-600 shadow-orange-100 text-orange-600 bg-orange-50'
    };
    const style = themes[theme] || themes.green;
    const [gradientFrom, gradientTo, shadow, textColor, bgColor] = style.split(' ');
    return (
        <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                    <h3 className={`text-3xl font-black text-gray-900 tracking-tight ${loading ? 'animate-pulse opacity-50' : ''}`}>{value}</h3>
                    <div className={`flex items-center gap-1 py-1 px-3 ${bgColor} rounded-full w-fit`}>
                        <ArrowRight className={`w-3 h-3 ${textColor}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${textColor}`}>{desc}</span>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg ${shadow} transform group-hover:rotate-12 transition-all`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};
