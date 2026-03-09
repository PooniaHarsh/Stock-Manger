import { useState, useEffect } from 'react';
import API from '../api/axios';
import { HiOutlineCash, HiOutlineCalendar, HiOutlinePlus, HiX, HiCheck } from 'react-icons/hi';

/**
 * Sales page — Record new sales, view today's sales with totals,
 * and filter sales by date range.
 */
const Sales = () => {
    const [sales, setSales] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isToday, setIsToday] = useState(true);
    const [loading, setLoading] = useState(true);

    // Record sale form state
    const [showSaleForm, setShowSaleForm] = useState(false);
    const [stockItems, setStockItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [saleQty, setSaleQty] = useState(1);
    const [saleLoading, setSaleLoading] = useState(false);
    const [saleMessage, setSaleMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchStockItems();
        fetchTodaySales();
    }, []);

    const fetchStockItems = async () => {
        try {
            const { data } = await API.get('/stock');
            setStockItems(data);
        } catch (error) {
            console.error('Error fetching stock:', error);
        }
    };

    const fetchTodaySales = async () => {
        setLoading(true);
        setIsToday(true);
        try {
            const { data } = await API.get('/sales/today');
            setSales(data.sales);
            setTotalAmount(data.totalAmount);

        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesByRange = async () => {
        setLoading(true);
        setIsToday(false);
        try {
            const { data } = await API.get(`/sales?startDate=${startDate}&endDate=${endDate}`);
            setSales(data.sales);
            setTotalAmount(data.totalAmount);

        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle recording a new sale
    const handleRecordSale = async () => {
        if (!selectedProduct) return;
        setSaleLoading(true);
        setSaleMessage({ text: '', type: '' });
        try {
            const { data } = await API.post('/sales', {
                productId: selectedProduct,
                quantity: Number(saleQty),
            });
            setSaleMessage({ text: `✅ Sale recorded! Remaining stock: ${data.remainingStock}`, type: 'success' });
            setSelectedProduct('');
            setSaleQty(1);
            // Refresh data
            fetchTodaySales();
            fetchStockItems();
            // Auto hide message after 3s
            setTimeout(() => setSaleMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setSaleMessage({ text: error.response?.data?.message || 'Failed to record sale', type: 'error' });
        } finally {
            setSaleLoading(false);
        }
    };

    const selectedProductData = stockItems.find(p => p._id === selectedProduct);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="page-title mb-0 flex items-center gap-3">
                    <HiOutlineCash className="text-emerald-500" />
                    Sales
                </h2>
                <button
                    onClick={() => { setShowSaleForm(!showSaleForm); setSaleMessage({ text: '', type: '' }); }}
                    className={`flex items-center gap-2 text-sm ${showSaleForm ? 'btn-secondary' : 'btn-primary'}`}
                >
                    {showSaleForm ? <HiX /> : <HiOutlinePlus className="text-lg" />}
                    {showSaleForm ? 'Close' : 'Record Sale'}
                </button>
            </div>

            {/* ====== RECORD SALE FORM (Expandable) ====== */}
            {showSaleForm && (
                <div className="card mb-6 border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 animate-slide-in">
                    <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center gap-2">
                        <HiOutlinePlus className="text-emerald-500" /> Record New Sale
                    </h3>

                    {saleMessage.text && (
                        <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-fade-in ${saleMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {saleMessage.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Product Selection */}
                        <div className="md:col-span-2">
                            <label className="label">Select Product</label>
                            <select
                                className="input-field"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                            >
                                <option value="">-- Choose a product --</option>
                                {stockItems.filter(p => p.quantity > 0).map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} {p.shadeType ? `(${p.shadeType})` : ''} {p.size ? `- ${p.size}` : ''} — Stock: {p.quantity} — ₹{p.sellingPrice}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="label">Quantity</label>
                            <input
                                type="number"
                                className="input-field"
                                value={saleQty}
                                onChange={(e) => setSaleQty(Math.max(1, Number(e.target.value)))}
                                min="1"
                                max={selectedProductData?.quantity || 999}
                            />
                        </div>
                    </div>

                    {/* Sale Preview */}
                    {selectedProductData && (
                        <div className="mb-4 p-4 rounded-xl bg-white border border-emerald-100 shadow-sm">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400 block">Product</span>
                                    <span className="font-semibold text-surface-800">{selectedProductData.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Price × Qty</span>
                                    <span className="font-semibold text-surface-800">₹{selectedProductData.sellingPrice} × {saleQty}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Total Amount</span>
                                    <span className="font-bold text-lg text-emerald-600">₹{(selectedProductData.sellingPrice * saleQty).toLocaleString()}</span>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Record Button */}
                    <button
                        onClick={handleRecordSale}
                        disabled={!selectedProduct || saleLoading}
                        className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saleLoading
                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                            : <HiCheck className="text-lg" />
                        }
                        {saleLoading ? 'Recording...' : 'Confirm & Record Sale'}
                    </button>
                </div>
            )}

            {/* Date Filter */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <div>
                            <label className="label">Start Date</label>
                            <input type="date" className="input-field" value={startDate}
                                onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">End Date</label>
                            <input type="date" className="input-field" value={endDate}
                                onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={fetchSalesByRange} className="btn-primary flex-1 sm:flex-initial flex items-center gap-2 text-sm">
                            <HiOutlineCalendar />
                            Filter
                        </button>
                        <button onClick={fetchTodaySales} className="btn-secondary flex-1 sm:flex-initial text-sm">
                            Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card bg-gradient-to-br from-blue-50 to-primary-50 border-primary-100">
                    <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Total Sales</p>
                    <p className="text-2xl font-bold text-surface-900 mt-1">{sales.length}</p>
                </div>
                <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Amount</p>
                    <p className="text-2xl font-bold text-surface-900 mt-1">₹{totalAmount.toLocaleString()}</p>
                </div>

            </div>

            {/* Sales List */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            ) : sales.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-400 text-lg mb-1">No sales found</p>
                    <p className="text-gray-300 text-sm">{isToday ? 'No sales recorded today yet' : 'Try a different date range'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sales.map((sale) => (
                        <div key={sale._id} className="card-hover animate-slide-in">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-semibold text-surface-800">{sale.productName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Qty: {sale.quantity} • {new Date(sale.date).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-surface-900">₹{(sale.sellingPrice * sale.quantity).toLocaleString()}</p>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Sales;
