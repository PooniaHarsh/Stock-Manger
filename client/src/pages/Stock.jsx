import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineUpload, HiX, HiOutlineDocumentText, HiCheck } from 'react-icons/hi';

/**
 * Stock page — displays stock list with search, edit, delete, and file import.
 */
const Stock = () => {
    const [stocks, setStocks] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(null);
    const navigate = useNavigate();

    // Import modal state
    const [showImport, setShowImport] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async (searchTerm = '') => {
        try {
            const { data } = await API.get(`/stock${searchTerm ? `?search=${searchTerm}` : ''}`);
            setStocks(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stock:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchStocks(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id) => {
        try {
            await API.delete(`/stock/${id}`);
            setStocks(stocks.filter(p => p._id !== id));
            setDeleteModal(null);
        } catch (error) {
            console.error('Error deleting stock item:', error);
        }
    };

    // ===== FILE IMPORT HANDLERS =====
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportFile(file);
            setImportPreview(null);
            setImportResult(null);
        }
    };

    const handlePreview = async () => {
        if (!importFile) return;
        setImportLoading(true);
        setImportResult(null);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            const { data } = await API.post('/stock/import?preview=true', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportPreview(data);
        } catch (error) {
            setImportResult({ type: 'error', text: error.response?.data?.message || 'Failed to parse file' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImportLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            const { data } = await API.post('/stock/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportResult({ type: 'success', text: data.message, errors: data.errors });
            setImportPreview(null);
            setImportFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchStocks(); // Refresh stock list
        } catch (error) {
            setImportResult({ type: 'error', text: error.response?.data?.message || 'Import failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const resetImport = () => {
        setShowImport(false);
        setImportFile(null);
        setImportPreview(null);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="page-title">Stock</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowImport(!showImport); setImportResult(null); }}
                        className={`inline-flex items-center gap-2 text-sm ${showImport ? 'btn-secondary' : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all'}`}
                    >
                        {showImport ? <HiX /> : <HiOutlineUpload className="text-lg" />}
                        {showImport ? 'Close' : 'Import'}
                    </button>
                    <Link to="/stock/add" className="btn-primary inline-flex items-center gap-2 text-sm">
                        <HiOutlinePlus className="text-lg" />
                        Add Stock
                    </Link>
                </div>
            </div>

            {/* ====== IMPORT SECTION ====== */}
            {showImport && (
                <div className="card mb-6 border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 animate-slide-in">
                    <h3 className="text-lg font-bold text-surface-800 mb-2 flex items-center gap-2">
                        <HiOutlineUpload className="text-emerald-500" /> Import Stock from File
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Upload a Delivery Challan PDF or an Excel (.xlsx/.csv) file.
                    </p>

                    {/* Format Guide */}
                    <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm">
                        <p className="font-semibold text-blue-700 mb-2">📋 Supported formats:</p>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">PDF</span>
                                <span className="text-blue-600 text-xs">Delivery Challan — auto-detected. Extracts Series, Design Name, Quantity.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">Excel</span>
                                <span className="text-blue-600 text-xs">Columns: Name, Shade Type, Size, Quantity, Selling Price, Barcode</span>
                            </div>
                        </div>
                        <p className="text-xs text-blue-400 mt-2">Re-importing the same file will update existing quantities instead of creating duplicates.</p>
                    </div>

                    {/* File Input */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="flex-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".xlsx,.xls,.csv,.pdf,.docx,.doc"
                                onChange={handleFileSelect}
                                className="input-field text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-600 file:font-medium file:cursor-pointer hover:file:bg-primary-200"
                            />
                        </div>
                        {importFile && !importPreview && (
                            <button
                                onClick={handlePreview}
                                disabled={importLoading}
                                className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50"
                            >
                                {importLoading ? <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div> : <HiOutlineDocumentText />}
                                {importLoading ? 'Parsing...' : 'Preview'}
                            </button>
                        )}
                    </div>

                    {/* File Info */}
                    {importFile && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                <HiOutlineDocumentText className="text-primary-500 text-lg" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-surface-800 truncate">{importFile.name}</p>
                                <p className="text-xs text-gray-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {importResult && (
                        <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-fade-in ${importResult.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            <p>{importResult.text}</p>
                            {importResult.errors?.length > 0 && (
                                <ul className="mt-2 text-xs opacity-80 list-disc list-inside">
                                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Preview Table */}
                    {importPreview && importPreview.products?.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-surface-800">
                                    Found <span className="text-emerald-600">{importPreview.validCount}</span> items to import
                                </p>
                            </div>
                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Series / Name</th>
                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Design</th>
                                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Size</th>
                                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {importPreview.products.slice(0, 20).map((p, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2 font-medium text-surface-800">{p.name}</td>
                                                <td className="px-3 py-2 text-gray-500">{p.shadeType || '—'}</td>
                                                <td className="px-3 py-2 text-gray-500">{p.size || '—'}</td>
                                                <td className="px-3 py-2 text-center">{p.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {importPreview.products.length > 20 && (
                                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-center">
                                        Showing 20 of {importPreview.products.length} items
                                    </div>
                                )}
                            </div>

                            {/* Import Now Button */}
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => { setImportPreview(null); setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="btn-secondary flex-1 sm:flex-initial">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importLoading}
                                    className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial disabled:opacity-50"
                                >
                                    {importLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <HiCheck className="text-lg" />}
                                    {importLoading ? 'Importing...' : `Import ${importPreview.validCount} Items`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="Search by name, shade, or barcode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Stock List */}
            {stocks.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-400 text-lg mb-2">No stock found</p>
                    <p className="text-gray-300 text-sm">Add your first stock item to get started</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block card overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Name</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Shade/Size</th>
                                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Qty</th>
                                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Price ₹</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Barcode</th>
                                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stocks.map((item) => (
                                        <tr key={item._id} className="hover:bg-primary-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-surface-800">{item.name}</p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {item.shadeType}{item.size ? ` / ${item.size}` : ''}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${item.quantity === 0 ? 'bg-red-100 text-red-600' : item.quantity <= 5 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-surface-800">₹{item.sellingPrice}</td>
                                            <td className="px-4 py-4 text-sm text-gray-400 font-mono">{item.barcode || '—'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => navigate(`/stock/edit/${item._id}`)} className="p-2 rounded-lg hover:bg-primary-100 text-primary-500 transition-colors" title="Edit">
                                                        <HiOutlinePencil />
                                                    </button>
                                                    <button onClick={() => setDeleteModal(item)} className="p-2 rounded-lg hover:bg-red-100 text-red-400 transition-colors" title="Delete">
                                                        <HiOutlineTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {stocks.map((item) => (
                            <div key={item._id} className="card-hover">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-semibold text-surface-800">{item.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {item.shadeType}{item.size ? ` / ${item.size}` : ''}
                                            {item.barcode ? ` • ${item.barcode}` : ''}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs font-medium text-surface-700">Price: ₹{item.sellingPrice}</span>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${item.quantity === 0 ? 'bg-red-100 text-red-600' : item.quantity <= 5 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button onClick={() => navigate(`/stock/edit/${item._id}`)} className="flex-1 py-2 text-sm font-medium text-primary-500 rounded-lg hover:bg-primary-50 transition-colors">Edit</button>
                                    <button onClick={() => setDeleteModal(item)} className="flex-1 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-sm w-full animate-fade-in">
                        <h3 className="text-lg font-bold text-surface-800 mb-2">Delete Stock Item?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={() => handleDelete(deleteModal._id)} className="btn-danger flex-1">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
