import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { HiOutlineArrowLeft, HiOutlineCheck } from 'react-icons/hi';

/**
 * AddStock page — used for both creating and editing stock items.
 * If an `:id` param is present, it loads the stock item and enters edit mode.
 */
const AddStock = () => {
    const { id } = useParams(); // edit mode if id is present
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        shadeType: '',
        size: '',
        quantity: '',
        sellingPrice: '',
        barcode: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(isEdit);

    // If editing, fetch existing stock data
    useEffect(() => {
        if (isEdit) {
            fetchStockItem();
        }
    }, [id]);

    const fetchStockItem = async () => {
        try {
            const { data } = await API.get(`/stock/${id}`);
            setForm({
                name: data.name || '',
                shadeType: data.shadeType || '',
                size: data.size || '',
                quantity: data.quantity?.toString() || '',
                sellingPrice: data.sellingPrice?.toString() || '',
                barcode: data.barcode || '',
            });
            setFetchLoading(false);
        } catch (error) {
            setError('Failed to load stock item');
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...form,
                quantity: Number(form.quantity),
                sellingPrice: Number(form.sellingPrice),
            };

            if (isEdit) {
                await API.put(`/stock/${id}`, payload);
            } else {
                await API.post('/stock', payload);
            }

            navigate('/stock');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/stock')}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <HiOutlineArrowLeft className="text-xl text-gray-600" />
                </button>
                <h2 className="page-title">{isEdit ? 'Edit Stock' : 'Add New Stock'}</h2>
            </div>

            {/* Form */}
            <div className="card">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="label" htmlFor="name">Name *</label>
                        <input id="name" name="name" className="input-field" placeholder="e.g. Asian Paint Emulsion"
                            value={form.name} onChange={handleChange} required />
                    </div>

                    {/* Shade Type & Size */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label" htmlFor="shadeType">Shade Type</label>
                            <input id="shadeType" name="shadeType" className="input-field" placeholder="e.g. Royal, Matt"
                                value={form.shadeType} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="label" htmlFor="size">Size / Number</label>
                            <input id="size" name="size" className="input-field" placeholder="e.g. 1L, 4L, 20L"
                                value={form.size} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="label" htmlFor="quantity">Quantity *</label>
                        <input id="quantity" name="quantity" type="number" min="0" className="input-field"
                            placeholder="e.g. 50" value={form.quantity} onChange={handleChange} required />
                    </div>

                    {/* Prices */}
                    <div>
                        <div>
                            <label className="label" htmlFor="sellingPrice">Selling Price (₹) *</label>
                            <input id="sellingPrice" name="sellingPrice" type="number" min="0" step="0.01" className="input-field"
                                placeholder="e.g. 350" value={form.sellingPrice} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Barcode */}
                    <div>
                        <label className="label" htmlFor="barcode">Barcode Number</label>
                        <input id="barcode" name="barcode" className="input-field font-mono" placeholder="e.g. 8901234567890"
                            value={form.barcode} onChange={handleChange} />
                    </div>


                    {/* Submit */}
                    <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        disabled={loading}>
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                Saving...
                            </span>
                        ) : (
                            <>
                                <HiOutlineCheck className="text-lg" />
                                {isEdit ? 'Update Stock' : 'Add Stock'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddStock;
