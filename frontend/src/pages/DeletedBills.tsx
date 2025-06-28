import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { printReceipt, BillData, printReport, ReportData } from '@/services/printService';
import { api, ShopDetails } from '@/services/api';
import PrinterConfigService from '@/services/printerConfig';

interface DeletedBillData {
  id: string;
  billNo: string;
  dateTime: string;
  paymentMode: string;
  tax: number;
  qty: number;
  netAmount: number;
  deletedAt: string;
  items: any[];
}

interface CustomDateRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const DeletedBills: React.FC = () => {
  const navigate = useNavigate();
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [bills, setBills] = useState<DeletedBillData[]>([]);
  const [filteredBills, setFilteredBills] = useState<DeletedBillData[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  useEffect(() => {
    fetchDeletedBills();
    api.getShopDetails().then(setShopDetails);
  }, [dateFilter, customDateRange]);

  const fetchDeletedBills = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/deleted-bills', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      const formattedBills: DeletedBillData[] = data.map((bill: any) => ({
        id: bill._id,
        billNo: bill.billNo,
        dateTime: bill.createdAt,
        paymentMode: bill.paymentMode || 'Cash',
        tax: bill.total * 0.1,
        qty: bill.items?.length || 0,
        netAmount: bill.total,
        deletedAt: bill.deletedAt,
        items: bill.items
      }));

      setBills(formattedBills);
      const filtered = filterBillsByDate(formattedBills);
      setFilteredBills(filtered);
    } catch (error) {
      console.error('Error fetching deleted bills:', error);
    }
  };

  const filterBillsByDate = (bills: DeletedBillData[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (dateFilter) {
      case 'today':
        return bills.filter(bill => {
          const billDate = new Date(bill.deletedAt);
          return billDate >= today && billDate < tomorrow;
        });
      case 'yesterday':
        return bills.filter(bill => {
          const billDate = new Date(bill.deletedAt);
          return billDate >= yesterday && billDate < today;
        });
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          const start = new Date(customDateRange.startDate + 'T' + (customDateRange.startTime || '00:00'));
          const end = new Date(customDateRange.endDate + 'T' + (customDateRange.endTime || '23:59'));
          return bills.filter(bill => {
            const billDate = new Date(bill.deletedAt);
            return billDate >= start && billDate <= end;
          });
        }
        return bills;
      default:
        return bills;
    }
  };

  const handleBack = () => {
    navigate('/report');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const filtered = bills.filter(bill => 
      bill.billNo.toLowerCase().includes(query.toLowerCase()) ||
      bill.netAmount.toString().includes(query)
    );
    setFilteredBills(filtered);
  };

  const handleDateFilterChange = (filter: 'today' | 'yesterday' | 'custom') => {
    setDateFilter(filter);
    if (filter === 'custom') {
      setIsDateFilterOpen(true);
    }
  };

  const handleCustomDateSubmit = (range: CustomDateRange) => {
    setCustomDateRange(range);
    setIsDateFilterOpen(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredBills.map(bill => bill.id));
      setSelectedBills(allIds);
    } else {
      setSelectedBills(new Set());
    }
  };

  const handleSelectBill = (id: string) => {
    const newSelectedBills = new Set(selectedBills);
    if (newSelectedBills.has(id)) {
      newSelectedBills.delete(id);
    } else {
      newSelectedBills.add(id);
    }
    setSelectedBills(newSelectedBills);
  };

  // Generate thermal printer format PDF as backup
  const printDeletedBillsReceipt = (billsToPrint: DeletedBillData[], fileName = 'DeletedBills.pdf') => {
    try {
      // Use thermal printer format (same as home page)
      const printerSettings = PrinterConfigService.getSettings();
      const pdfFormat = PrinterConfigService.getPDFFormat(printerSettings.selectedWidth);
      const layout = PrinterConfigService.getPDFLayout(printerSettings.selectedWidth);

      // Validate layout before generating PDF
      if (!PrinterConfigService.validatePDFLayout(printerSettings.selectedWidth)) {
        console.warn('PDF layout validation failed, using default 80mm layout');
      }

      const doc = new jsPDF({ unit: 'pt', format: pdfFormat });

      let y = layout.topMargin;
      const addSpace = (space = layout.lineHeight) => { y += space; };
      const dottedLine = () => {
        doc.setLineDashPattern([2, 2], 0);
        doc.line(layout.leftMargin, y, layout.paperWidth - layout.rightMargin, y);
        addSpace(layout.sectionSpacing);
        doc.setLineDashPattern([], 0);
        addSpace(layout.sectionSpacing);
      };

      // Shop details
      doc.setFontSize(layout.headerFontSize);
      doc.text(shopDetails?.shopName || 'TapBill Restaurant', layout.centerX, y, { align: 'center' });
      addSpace();
      doc.setFontSize(layout.subHeaderFontSize);
      if (shopDetails?.shopAddress) {
        doc.text(shopDetails.shopAddress, layout.centerX, y, { align: 'center', maxWidth: layout.contentWidth });
        addSpace();
      }
      if (shopDetails?.phone) {
        doc.text(`Ph: ${shopDetails.phone}`, layout.centerX, y, { align: 'center' });
        addSpace();
      }
      dottedLine();

      // Title
      doc.setFontSize(layout.bodyFontSize);
      doc.text('Deleted Bills Report', layout.centerX, y, { align: 'center' });
      addSpace();
      // Format current date and time as DD/MM/YYYY HH:MM
      const currentDate = new Date();
      const formattedDateTime = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth()+1).toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
      doc.text(formattedDateTime, layout.centerX, y, { align: 'center' });
      addSpace();
      dottedLine();

      // Table headers (no S.No column) - optimized column spacing
      doc.setFontSize(layout.itemFontSize);

      // Optimized column positions for better space utilization
      const optimizedColumns = {
        billNo: layout.columns.item,                    // Bill# column (original position)
        deleted: layout.columns.item + 30,              // Deleted column (reduced gap completely)
        tax: layout.columns.price - 15,                 // Tax column (moved left)
        total: layout.columns.total                      // Total column (original position)
      };

      doc.text('Bill#', optimizedColumns.billNo, y);
      doc.text('Deleted', optimizedColumns.deleted, y);
      doc.text('Tax', optimizedColumns.tax, y);
      doc.text('Total', optimizedColumns.total, y);
      addSpace();
      dottedLine();

      // Table rows (no S.No column) - optimized column spacing
      billsToPrint.forEach((bill) => {
        // Format deleted date and time as DD/MM/YYYY HH:MM
        const deletedDate = new Date(bill.deletedAt || bill.dateTime || new Date());
        const formattedDateTime = `${deletedDate.getDate().toString().padStart(2, '0')}/${(deletedDate.getMonth()+1).toString().padStart(2, '0')}/${deletedDate.getFullYear()} ${deletedDate.getHours().toString().padStart(2, '0')}:${deletedDate.getMinutes().toString().padStart(2, '0')}`;

        // Optimized column positions for better space utilization
        const optimizedColumns = {
          billNo: layout.columns.item,                    // Bill# column (original position)
          deleted: layout.columns.item + 30,              // Deleted column (reduced gap completely)
          tax: layout.columns.price - 15,                 // Tax column (moved left)
          total: layout.columns.total                      // Total column (original position)
        };

        doc.text(String(bill.billNo || 'N/A'), optimizedColumns.billNo, y, { maxWidth: 25 });

        // Conditional date/time formatting based on printer width
        if (layout.paperWidth <= 200) { // 58mm format - split into two lines
          const dateOnly = formattedDateTime.substring(0, 10); // DD/MM/YYYY
          const timeOnly = formattedDateTime.substring(11, 16); // HH:MM
          doc.text(dateOnly, optimizedColumns.deleted, y);
          addSpace(layout.lineHeight * 0.7);
          doc.text(timeOnly, optimizedColumns.deleted, y);
          addSpace(layout.lineHeight * 0.3);

          // Reset y position for other columns
          y -= layout.lineHeight;
          doc.text(String((bill.tax || 0).toFixed(0)), optimizedColumns.tax, y);
          doc.text(String((bill.netAmount || 0).toFixed(0)), optimizedColumns.total, y);
        } else { // 80mm format - single line
          const compactDateTime = `${formattedDateTime.substring(0, 10)} ${formattedDateTime.substring(11, 16)}`; // DD/MM/YYYY HH:MM
          doc.text(compactDateTime, optimizedColumns.deleted, y, { maxWidth: 50 });

          doc.text(String((bill.tax || 0).toFixed(0)), optimizedColumns.tax, y);
          doc.text(String((bill.netAmount || 0).toFixed(0)), optimizedColumns.total, y);
        }

        // Add extra spacing between rows to prevent collision
        addSpace(layout.lineHeight * 1.5);
      });
      dottedLine();

      // Footer
      doc.setFontSize(layout.bodyFontSize);
      addSpace(layout.sectionSpacing);
      doc.text('Thank You, Visit again.', layout.centerX, y, { align: 'center' });

      // Save PDF with printer width in filename
      const thermalFileName = fileName.replace('.pdf', `_${printerSettings.selectedWidth}.pdf`);
      doc.save(thermalFileName);
    } catch (error) {
      console.error('Error generating thermal print PDF:', error);
    }
  };

  const handlePrintSingle = async (bill: DeletedBillData) => {
    // Convert single deleted bill to BillData format for direct printing (same as home page)
    const billData: BillData = {
      billNo: bill.billNo || 'N/A',
      items: [{
        name: `Deleted Bill ${bill.billNo || 'N/A'} (${bill.qty || 0} items)`,
        quantity: 1,
        price: bill.netAmount || 0,
        total: bill.netAmount || 0
      }],
      total: bill.netAmount || 0,
      createdAt: new Date(bill.deletedAt || new Date()),
      shopDetails: {
        name: shopDetails?.shopName || 'TapBill Restaurant',
        address: shopDetails?.shopAddress || '',
        phone: shopDetails?.phone || ''
      }
    };

    // Try direct printing first (same as home page)
    let printSuccess = false;
    try {
      printSuccess = await printReceipt(billData, { silent: true });
    } catch (error) {
      console.error('Direct print error:', error);
    }

    // Show success/failure message and handle PDF generation
    const printerSettings = PrinterConfigService.getSettings();
    if (printSuccess) {
      // Printer connected and printing successful - no PDF needed
      alert(`✅ Deleted bill ${bill.billNo} printed successfully (${printerSettings.selectedWidth})!`);
    } else {
      // Printer not connected - show error and generate PDF as backup
      printDeletedBillsReceipt([bill], `DeletedBill_${bill.billNo || 'NA'}.pdf`);
      alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
    }
  };

  const handlePrint = async () => {
    const selected = filteredBills.filter(bill => selectedBills.has(bill.id));
    if (selected.length === 0) {
      alert('Please select bills to print');
      return;
    }

    // Prepare report data for direct printing
    const reportData: ReportData = {
      title: 'Deleted Bills Report',
      date: new Date().toLocaleDateString(),
      items: selected.map(bill => ({
        'Bill#': bill.billNo || 'N/A',
        'Items': (bill.items && bill.items.length) || 0,
        'Qty': bill.qty || 0,
        'Tax': `₹${(bill.tax || 0).toFixed(2)}`,
        'Net': `₹${(bill.netAmount || 0).toFixed(2)}`,
        'Date': bill.deletedAt ? new Date(bill.deletedAt).toLocaleDateString() : 'N/A'
      })),
      totals: {
        'Total Bills': selected.length,
        'Total Quantity': selected.reduce((sum, bill) => sum + (bill.qty || 0), 0),
        'Total Amount': `₹${selected.reduce((sum, bill) => sum + (bill.netAmount || 0), 0).toFixed(2)}`
      }
    };

    // Try direct printing first
    let printSuccess = false;
    try {
      printSuccess = await printReport(reportData, { silent: true });
      if (printSuccess) {
        console.log('✅ Deleted bills report printed successfully');
      }
    } catch (error) {
      console.error('Direct print error:', error);
    }

    // Show success/failure message and handle PDF generation
    const printerSettings = PrinterConfigService.getSettings();
    if (printSuccess) {
      // Printer connected and printing successful - no PDF needed
      alert(`✅ Report printed successfully (${printerSettings.selectedWidth})!`);
    } else {
      // Printer not connected - show error and generate PDF as backup
      printDeletedBillsReceipt(selected, 'DeletedBills_Selected.pdf');
      alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
    }
  };

  const handleExport = async () => {
    try {
      const selectedBillsData = filteredBills.filter(bill => selectedBills.has(bill.id));
      const response = await fetch('http://localhost:5000/api/export/deletedBills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          bills: selectedBillsData,
          type: dateFilter,
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deleted_bills_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export deleted bills');
        alert('Failed to export deleted bills. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting deleted bills:', error);
      alert('Error exporting deleted bills. Please try again.');
    }
  };

  const handleViewBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      navigate(`/deleted-bill-details/${billId}`, { state: { bill } });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={handleBack} className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg">←</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Deleted Bills
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Date Filter Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => handleDateFilterChange('today')}
              className={`px-4 py-2 rounded-2xl ${
                dateFilter === 'today' ? 'bg-[rgb(56,224,120)] text-white' : 'bg-gray-100'
              }`}
            >
              Today's
            </button>
            <button
              onClick={() => handleDateFilterChange('yesterday')}
              className={`px-4 py-2 rounded-2xl ${
                dateFilter === 'yesterday' ? 'bg-[rgb(56,224,120)] text-white' : 'bg-gray-100'
              }`}
            >
              Yesterday's
            </button>
            <button
              onClick={() => handleDateFilterChange('custom')}
              className={`px-4 py-2 rounded-2xl ${
                dateFilter === 'custom' ? 'bg-[rgb(56,224,120)] text-white' : 'bg-gray-100'
              }`}
            >
              Date Custom
            </button>
          </div>

          {/* Search and Actions */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className="relative w-1/2">
                <input
                  type="text"
                  placeholder="Search by Bill No or Amount"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full bg-gray-200 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] border-solid focus:outline-none focus:ring-2 focus:ring-[rgb(56,224,120)] focus:border-transparent text-sm"
                />
                <button 
                  onClick={() => setIsDateFilterOpen(true)}
                  className="absolute right-0 top-0 h-10 px-4 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"></path>
                  </svg>
                </button>
              </div>
              <div className="flex ml-4 justify-end flex-1">
                <button 
                  onClick={handlePrint}
                  className="bg-[rgb(56,224,120)] text-white h-10 px-6 rounded-lg mr-2"
                >
                  Print
                </button>
                <button 
                  onClick={handleExport}
                  className="bg-[#F5F5F5] text-black h-10 px-6 rounded-lg"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedBills.size === filteredBills.length && filteredBills.length > 0}
                      className="mx-auto h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Sr.No</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Bill No</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Date Time</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Payment Mode</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Tax</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Qty</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Net Amount</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Print</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedBills.map((bill, index) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill.id)}
                        onChange={() => handleSelectBill(bill.id)}
                        className="mx-auto h-4 w-4"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-center">{bill.billNo || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">{bill.dateTime ? new Date(bill.dateTime).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 text-center">{bill.paymentMode || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">₹{(bill.tax || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">{bill.qty || 0}</td>
                    <td className="px-6 py-4 text-center">₹{(bill.netAmount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handlePrintSingle(bill)}
                        className="text-green-500 hover:text-green-700 p-1"
                        title="Print this bill"
                      >
                        🖨️
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewBill(bill.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === page
                    ? 'bg-[rgb(56,224,120)] text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {isDateFilterOpen && dateFilter === 'custom' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-bold mb-4">Select Date Range</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={e => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={customDateRange.startTime}
                  onChange={e => setCustomDateRange(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={e => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={customDateRange.endTime}
                  onChange={e => setCustomDateRange(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsDateFilterOpen(false)}
                  className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCustomDateSubmit(customDateRange)}
                  className="flex-1 py-2 px-4 bg-[rgb(56,224,120)] text-white rounded-lg hover:bg-[rgb(46,204,110)]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedBills; 