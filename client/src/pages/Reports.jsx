import { useState } from 'react';
import API from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    HiOutlineChartBar, HiOutlineDocumentDownload, HiOutlineCalendar
} from 'react-icons/hi';

/**
 * Reports page — displays daily and monthly reports with PDF export.
 */
const Reports = () => {
    const [reportType, setReportType] = useState('daily'); // 'daily' or 'monthly'
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let data;
            if (reportType === 'daily') {
                const res = await API.get(`/reports/daily?date=${date}`);
                data = res.data;
            } else {
                const res = await API.get(`/reports/monthly?month=${month}&year=${year}`);
                data = res.data;
            }
            setReport(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Export the current report as a PDF.
     */
    const exportPDF = () => {
        if (!report) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Inventory Management Report', pageWidth / 2, 20, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const subtitle = reportType === 'daily'
            ? `Daily Report — ${report.date}`
            : `Monthly Report — ${report.month}/${report.year}`;
        doc.text(subtitle, pageWidth / 2, 30, { align: 'center' });

        // Summary
        doc.setFontSize(10);
        doc.text(`Total Sales: ${report.totalSales}`, 14, 45);
        doc.text(`Total Revenue: Rs.${report.totalRevenue?.toLocaleString()}`, 14, 52);


        // Table
        if (reportType === 'daily' && report.products) {
            autoTable(doc, {
                startY: 68,
                head: [['Product', 'Qty Sold', 'Revenue (Rs.)']],
                body: report.products.map(p => [
                    p.productName,
                    p.totalQuantity,
                    p.totalRevenue.toLocaleString(),
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [99, 102, 241] },
            });
        } else if (reportType === 'monthly' && report.dailyBreakdown) {
            autoTable(doc, {
                startY: 68,
                head: [['Date', 'Sales', 'Revenue (Rs.)']],
                body: report.dailyBreakdown.map(d => [
                    d.date,
                    d.totalSales,
                    d.totalRevenue.toLocaleString(),
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [99, 102, 241] },
            });
        }

        // Footer
        const finalY = doc.lastAutoTable?.finalY || 70;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 14, finalY + 15);

        const filename = reportType === 'daily'
            ? `report_${report.date}.pdf`
            : `report_${report.month}_${report.year}.pdf`;
        doc.save(filename);
    };

    return (
        <div className="animate-fade-in">
            <h2 className="page-title mb-6 flex items-center gap-3">
                <HiOutlineChartBar className="text-primary-500" />
                Reports
            </h2>

            {/* Controls */}
            <div className="card mb-6">
                {/* Report Type Toggle */}
                <div className="flex gap-2 mb-5">
                    <button
                        onClick={() => { setReportType('daily'); setReport(null); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${reportType === 'daily'
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        Daily Report
                    </button>
                    <button
                        onClick={() => { setReportType('monthly'); setReport(null); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${reportType === 'monthly'
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        Monthly Report
                    </button>
                </div>

                {/* Date Inputs */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {reportType === 'daily' ? (
                        <div className="flex-1">
                            <label className="label">Select Date</label>
                            <input type="date" className="input-field" value={date}
                                onChange={(e) => setDate(e.target.value)} />
                        </div>
                    ) : (
                        <>
                            <div className="flex-1">
                                <label className="label">Month</label>
                                <select className="input-field" value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="label">Year</label>
                                <input type="number" className="input-field" value={year} min={2020} max={2030}
                                    onChange={(e) => setYear(Number(e.target.value))} />
                            </div>
                        </>
                    )}
                    <div className="flex items-end">
                        <button onClick={fetchReport} className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto">
                            <HiOutlineCalendar />
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Results */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            ) : report ? (
                <div className="animate-fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="card bg-gradient-to-br from-blue-50 to-primary-50">
                            <p className="text-xs font-semibold text-primary-400 uppercase">Total Sales</p>
                            <p className="text-2xl font-bold text-surface-900 mt-1">{report.totalSales}</p>
                        </div>
                        <div className="card bg-gradient-to-br from-emerald-50 to-green-50">
                            <p className="text-xs font-semibold text-emerald-400 uppercase">Revenue</p>
                            <p className="text-2xl font-bold text-surface-900 mt-1">₹{report.totalRevenue?.toLocaleString()}</p>
                        </div>

                    </div>

                    {/* Data Table */}
                    <div className="card overflow-hidden p-0 mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        {reportType === 'daily' ? (
                                            <>
                                                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Product</th>
                                                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-4">Qty</th>
                                                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-4">Revenue</th>

                                            </>
                                        ) : (
                                            <>
                                                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Date</th>
                                                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-4">Sales</th>
                                                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-4">Revenue</th>

                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {reportType === 'daily' ? (
                                        report.products?.length > 0 ? (
                                            report.products.map((p, i) => (
                                                <tr key={i} className="hover:bg-primary-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-surface-800">{p.productName}</td>
                                                    <td className="px-4 py-4 text-sm text-center text-gray-600">{p.totalQuantity}</td>
                                                    <td className="px-4 py-4 text-sm text-right text-gray-600">₹{p.totalRevenue.toLocaleString()}</td>

                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data for this date</td></tr>
                                        )
                                    ) : (
                                        report.dailyBreakdown?.length > 0 ? (
                                            report.dailyBreakdown.map((d, i) => (
                                                <tr key={i} className="hover:bg-primary-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-surface-800">{d.date}</td>
                                                    <td className="px-4 py-4 text-sm text-center text-gray-600">{d.totalSales}</td>
                                                    <td className="px-4 py-4 text-sm text-right text-gray-600">₹{d.totalRevenue.toLocaleString()}</td>

                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data for this month</td></tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Export Button */}
                    <button onClick={exportPDF} className="btn-primary inline-flex items-center gap-2">
                        <HiOutlineDocumentDownload className="text-lg" />
                        Export as PDF
                    </button>
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-gray-400 text-lg mb-1">Select a date and click Generate</p>
                    <p className="text-gray-300 text-sm">Your report will appear here</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
