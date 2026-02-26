import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search, Package, Edit,
    Image as ImageIcon, MoreVertical, Filter,
    CheckCircle, XCircle
} from 'lucide-react';
import api from '../utils/api';
import { useRefresh } from '../context/RefreshContext';
import ProductModal from '../components/ProductModal';

export default function ProductsPage() {
    const { brand: urlBrand } = useParams();
    const b = urlBrand || 'littleh';
    const { tick, bump } = useRefresh();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/products');
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [tick, b]);

    const categories = ['all', ...new Set(products.map(p => {
        const cat = p.category?.name || p.category;
        return typeof cat === 'string' ? cat : JSON.stringify(cat);
    }).filter(Boolean))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const catName = product.category?.name || product.category;
        const matchesCategory = categoryFilter === 'all' || catName === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };


    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-bakery-primary uppercase tracking-tight">Product Catalog</h1>
                    <p className="text-bakery-accent mt-1 font-bold uppercase text-[10px] tracking-widest">Inventory Management</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-accent" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-12"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-bakery-accent shrink-0" />
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${categoryFilter === cat
                                ? 'bg-bakery-primary text-white shadow-lg shadow-bakery-primary/20'
                                : 'bg-bakery-light text-bakery-accent hover:bg-white'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product._id} className="card group relative overflow-hidden">
                        <div className="aspect-square rounded-2xl bg-bakery-light mb-6 overflow-hidden relative">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-bakery-accent opacity-20">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-black text-[10px] uppercase text-bakery-primary shadow-sm">
                                {product.cakePricing?.basePricePerKg ? (
                                    `₹${product.displayPrice || product.cakePricing.basePricePerKg} / kg`
                                ) : product.sizeOptions?.length > 0 ? (
                                    `From ₹${product.displayPrice}`
                                ) : (
                                    `₹${product.displayPrice || product.price || 0}`
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-bakery-accent uppercase tracking-[0.2em] mb-1">{product.category?.name || product.category}</p>
                                    <h3 className="text-lg font-black text-bakery-primary uppercase tracking-tight leading-tight">{product.name}</h3>
                                </div>
                                <div className={`flex items-center gap-1 ${product.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {product.isAvailable ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                </div>
                            </div>

                            <div className="flex pt-4 border-t border-bakery-light gap-2">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="flex-1 bg-bakery-light hover:bg-bakery-primary hover:text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn font-black uppercase"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Update Price & Stock</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSuccess={bump}
            />
        </div>
    );
}
