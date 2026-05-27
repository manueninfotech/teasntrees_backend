import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Users, Search, Mail, Phone,
    Calendar, MapPin, ShoppingBag
} from 'lucide-react';
import api from '../utils/api';
import { useRefresh } from '../context/RefreshContext';

export default function CustomersPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'littleh';
    const { tick } = useRefresh();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/customers');
            setCustomers(response.data.data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [tick, b]);

    const filteredCustomers = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile?.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">Customer Database</h1>
                    <p className="text-bakery-accent mt-1 font-bold uppercase text-[10px] tracking-widest">Client Relationships</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <Users className="w-5 h-5 text-bakery-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-bakery-primary">{customers.length} Total</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-accent" />
                    <input
                        type="text"
                        placeholder="Search by name, email or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-12"
                    />
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                    <div key={customer._id} className="card group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-bakery-light rounded-2xl flex items-center justify-center text-bakery-primary border-4 border-white shadow-lg overflow-hidden">
                                    {customer.profileImage ? (
                                        <img src={customer.profileImage} alt={customer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-8 h-8" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-bakery-primary uppercase tracking-tight">{customer.name}</h3>
                                    <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest italic">Since {new Date(customer.createdAt).getFullYear()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-bakery-accent bg-bakery-light/30 p-4 rounded-2xl transition-all group-hover:bg-white border border-transparent group-hover:border-bakery-light">
                                <Phone className="w-4 h-4" />
                                <span className="text-xs font-bold">{customer.mobile}</span>
                            </div>
                            <div className="flex items-center gap-3 text-bakery-accent bg-bakery-light/30 p-4 rounded-2xl transition-all group-hover:bg-white border border-transparent group-hover:border-bakery-light">
                                <Mail className="w-4 h-4" />
                                <span className="text-xs font-bold truncate">{customer.email || 'No email provided'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-bakery-light">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-bakery-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-bakery-primary">{customer.totalOrders || 0} Orders</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
