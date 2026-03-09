import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import API from '../api/axios';
import { HiOutlineQrcode, HiOutlineCheck, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';

/**
 * BarcodeScanner page — uses the phone/laptop camera to scan barcodes.
 * On scan: finds the product, shows details, and records a sale.
 */
const BarcodeScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [scannedProduct, setScannedProduct] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [saleLoading, setSaleLoading] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    // Clean up scanner on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setMessage({ text: '', type: '' });
        setScannedProduct(null);
        setScanning(true);

        try {
            const html5QrCode = new Html5Qrcode('barcode-reader');
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' }, // rear camera
                {
                    fps: 10,
                    qrbox: { width: 280, height: 150 },
                    aspectRatio: 1.0,
                },
                async (decodedText) => {
                    // Barcode scanned successfully
                    await stopScanner();
                    await lookupProduct(decodedText);
                },
                () => { } // ignore errors during scanning
            );
        } catch (error) {
            console.error('Scanner error:', error);
            setMessage({ text: 'Failed to start camera. Please allow camera permissions.', type: 'error' });
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        try {
            if (html5QrCodeRef.current) {
                const state = html5QrCodeRef.current.getState();
                // Only stop if it's scanning (state 2 = SCANNING)
                if (state === 2) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }
        } catch (error) {
            // Ignore cleanup errors
        }
        setScanning(false);
    };

    const lookupProduct = async (barcode) => {
        try {
            const { data } = await API.get(`/stock/barcode/${barcode}`);
            setScannedProduct(data);
            setMessage({ text: `Product found: ${data.name}`, type: 'success' });
        } catch (error) {
            setMessage({ text: `No product found for barcode: ${barcode}`, type: 'error' });
        }
    };

    const recordSale = async () => {
        if (!scannedProduct) return;
        setSaleLoading(true);

        try {
            const { data } = await API.post('/sales', {
                productId: scannedProduct._id,
                quantity: 1,
            });
            setMessage({
                text: `✅ Sale recorded! ${scannedProduct.name} — ₹${scannedProduct.sellingPrice}. Stock remaining: ${data.remainingStock}`,
                type: 'success',
            });
            setScannedProduct(null);
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Failed to record sale', type: 'error' });
        } finally {
            setSaleLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-lg mx-auto">
            <h2 className="page-title mb-6 flex items-center gap-3">
                <HiOutlineQrcode className="text-primary-500" />
                Barcode Scanner
            </h2>

            {/* Scanner Area */}
            <div className="card mb-6">
                <div
                    id="barcode-reader"
                    ref={scannerRef}
                    className="w-full rounded-xl overflow-hidden bg-gray-900 mb-4"
                    style={{ minHeight: scanning ? 300 : 0, display: scanning ? 'block' : 'none' }}
                ></div>

                {!scanning && !scannedProduct && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
                            <HiOutlineQrcode className="text-primary-500 text-4xl" />
                        </div>
                        <p className="text-gray-500 text-sm mb-6">Point your camera at a barcode to scan</p>
                        <button onClick={startScanner} className="btn-primary inline-flex items-center gap-2">
                            <HiOutlineQrcode />
                            Start Scanning
                        </button>
                    </div>
                )}

                {scanning && (
                    <button onClick={stopScanner} className="btn-secondary w-full flex items-center justify-center gap-2">
                        <HiOutlineX />
                        Stop Scanner
                    </button>
                )}
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium animate-fade-in ${message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Scanned Product Details */}
            {scannedProduct && (
                <div className="card animate-fade-in">
                    <h3 className="text-lg font-bold text-surface-800 mb-4">Scanned Product</h3>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Name</span>
                            <span className="font-semibold text-surface-800">{scannedProduct.name}</span>
                        </div>
                        {scannedProduct.shadeType && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shade</span>
                                <span className="text-surface-700">{scannedProduct.shadeType}</span>
                            </div>
                        )}
                        {scannedProduct.size && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Size</span>
                                <span className="text-surface-700">{scannedProduct.size}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Price</span>
                            <span className="font-bold text-emerald-600">₹{scannedProduct.sellingPrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">In Stock</span>
                            <span className={`font-bold ${scannedProduct.quantity <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {scannedProduct.quantity}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setScannedProduct(null); startScanner(); }}
                            className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        >
                            <HiOutlineRefresh />
                            Scan Again
                        </button>
                        <button
                            onClick={recordSale}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                            disabled={saleLoading || scannedProduct.quantity === 0}
                        >
                            {saleLoading ? (
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <HiOutlineCheck />
                            )}
                            {scannedProduct.quantity === 0 ? 'Out of Stock' : 'Record Sale'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
