import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import StatCard from '../components/StatCard';
import { HiOutlineCube, HiOutlineExclamation, HiOutlineCash, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

/**
 * Dashboard — Hero banner with auto-sliding gallery, key stats,
 * low stock alerts, and recent sales.
 */
const galleryImages = [
    { src: '/1.jpg', caption: 'Ideal Laminates — Premium Interiors' },
    { src: '/2.jpg', caption: 'Delightful Laminates — Settling Ambience' },
    { src: '/3.jpg', caption: 'Excellence at Both Light and Dark' },
    { src: '/4.jpg', caption: 'Ideal Match for Your Interior' },
    { src: '/5.jpg', caption: 'Affordability & Innovation' },
];

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStock: 0,
        lowStockCount: 0,
        todaySales: 0,
    });
    const [lowStockItems, setLowStockItems] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Gallery state
    const [currentSlide, setCurrentSlide] = useState(0);
    const slideTimer = useRef(null);



    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Auto-slide gallery every 4 seconds
    useEffect(() => {
        slideTimer.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % galleryImages.length);
        }, 4000);
        return () => clearInterval(slideTimer.current);
    }, []);

    const goToSlide = (idx) => {
        setCurrentSlide(idx);
        clearInterval(slideTimer.current);
        slideTimer.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % galleryImages.length);
        }, 4000);
    };

    const nextSlide = () => goToSlide((currentSlide + 1) % galleryImages.length);
    const prevSlide = () => goToSlide((currentSlide - 1 + galleryImages.length) % galleryImages.length);

    const fetchDashboardData = async () => {
        try {
            const [stockRes, salesRes] = await Promise.all([
                API.get('/stock'),
                API.get('/sales/today'),
            ]);

            const allItems = stockRes.data;
            const todaySales = salesRes.data;
            const lowStock = allItems.filter(p => p.quantity <= 5);


            setStats({
                totalStock: allItems.length,
                lowStockCount: lowStock.length,
                todaySales: todaySales.count,
            });
            setLowStockItems(lowStock.slice(0, 5));
            setRecentSales(todaySales.sales.slice(0, 5));
            setLoading(false);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* ===== HERO BANNER WITH GALLERY ===== */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl group" style={{ height: '320px' }}>
                {/* Slides */}
                {galleryImages.map((img, idx) => (
                    <div
                        key={idx}
                        className="absolute inset-0 transition-all duration-700 ease-in-out"
                        style={{
                            opacity: idx === currentSlide ? 1 : 0,
                            transform: idx === currentSlide ? 'scale(1)' : 'scale(1.05)',
                        }}
                    >
                        <img
                            src={img.src}
                            alt={img.caption}
                            className="w-full h-full object-cover"
                        />
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                ))}

                {/* Brand overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex items-end justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-xl shadow-lg border-2 border-white/20 object-contain bg-white/10 backdrop-blur-sm" />
                        <div>
                            <h2 className="text-2xl font-bold text-white drop-shadow-lg">Punjab Trading Co.</h2>
                            <p className="text-sm text-white/80 font-medium">(PARVEEN KUMAR) — Plywood & Laminates</p>
                        </div>
                    </div>

                </div>

                {/* Slide caption */}
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-lg text-xs font-medium text-white border border-white/20">
                        {galleryImages[currentSlide].caption}
                    </span>
                </div>

                {/* Navigation arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                >
                    <HiChevronLeft className="text-xl" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                >
                    <HiChevronRight className="text-xl" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 right-6 z-10 flex gap-2">
                    {galleryImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </div>



            {/* ===== STAT CARDS ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Stock" value={stats.totalStock} icon={<HiOutlineCube />} color="from-blue-500 to-blue-600" subtitle="Items in inventory" />
                <StatCard title="Low Stock" value={stats.lowStockCount} icon={<HiOutlineExclamation />} color="from-amber-500 to-orange-500" subtitle="≤ 5 items remaining" />
                <StatCard title="Today's Sales" value={stats.todaySales} icon={<HiOutlineCash />} color="from-emerald-500 to-green-600" subtitle="Transactions today" />
            </div>

            {/* ===== ALERTS & SALES GRID ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Alerts */}
                <div className="card">
                    <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center gap-2">
                        <HiOutlineExclamation className="text-amber-500" />
                        Low Stock Alerts
                    </h3>
                    {lowStockItems.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">All stock is well-stocked 🎉</p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockItems.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                                    <div>
                                        <p className="text-sm font-semibold text-surface-800">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.shadeType} {product.size && `• ${product.size}`}</p>
                                    </div>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${product.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {product.quantity} left
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="card">
                    <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center gap-2">
                        <HiOutlineCash className="text-emerald-500" />
                        Recent Sales Today
                    </h3>
                    {recentSales.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">No sales recorded today</p>
                    ) : (
                        <div className="space-y-3">
                            {recentSales.map((sale) => (
                                <div key={sale._id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <div>
                                        <p className="text-sm font-semibold text-surface-800">{sale.productName}</p>
                                        <p className="text-xs text-gray-500">Qty: {sale.quantity} • {new Date(sale.date).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== PRODUCT GALLERY ===== */}
            <div>
                <h3 className="text-lg font-bold text-surface-800 mb-4">Our Product Range</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {galleryImages.map((img, idx) => (
                        <div
                            key={idx}
                            className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer aspect-square"
                            onClick={() => goToSlide(idx)}
                        >
                            <img
                                src={img.src}
                                alt={img.caption}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <p className="absolute bottom-0 left-0 right-0 p-3 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                                {img.caption}
                            </p>
                        </div>
                    ))}
                </div>
            </div>


        </div>
    );
};

export default Dashboard;
