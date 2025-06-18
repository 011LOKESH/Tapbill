import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DateFilterModal from '@/components/tapbill/DateFilterModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { api, ShopDetails } from '@/services/api';

interface BillData {
  id: string;
  billNo: string;
  dateTime: string;
  paymentMode: string;
  tax: number;
  qty: number;
  netAmount: number;
}

interface CustomDateRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const BillWiseSales: React.FC = () => {
  const navigate = useNavigate();
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [bills, setBills] = useState<BillData[]>([]);
  const [filteredBills, setFilteredBills] = useState<BillData[]>([]);
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
    fetchBills();
    api.getShopDetails().then(setShopDetails);
  }, [dateFilter, customDateRange]);

  const fetchBills = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
      const response = await fetch('http://localhost:5000/api/bill-items', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      const formattedBills: BillData[] = data.map((bill: any) => ({
        id: bill._id,
        billNo: bill._id,
        dateTime: bill.createdAt,
        paymentMode: bill.paymentMode || 'Cash',
        tax: bill.total * 0.1,
        qty: bill.items?.length || 0,
        netAmount: bill.total
      }));

      setBills(formattedBills);
      const filtered = filterBillsByDate(formattedBills);
      setFilteredBills(filtered);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const filterBillsByDate = (bills: BillData[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (dateFilter) {
      case 'today':
        return bills.filter(bill => {
          const billDate = new Date(bill.dateTime);
          return billDate >= today && billDate < tomorrow;
        });
      case 'yesterday':
        return bills.filter(bill => {
          const billDate = new Date(bill.dateTime);
          return billDate >= yesterday && billDate < today;
        });
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          const start = new Date(customDateRange.startDate + 'T' + (customDateRange.startTime || '00:00'));
          const end = new Date(customDateRange.endDate + 'T' + (customDateRange.endTime || '23:59'));
          return bills.filter(bill => {
            const billDate = new Date(bill.dateTime);
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

  const printBillsReceipt = (billsToPrint: BillData[], fileName = 'BillWiseSales.pdf') => {
    const doc = new jsPDF({ unit: 'pt', format: [300, 600 + billsToPrint.length * 20] });
    let y = 30;
    const lineGap = 18;
    const addSpace = (space = 8) => { y += space; };
    const dottedLine = () => {
      doc.setLineDashPattern([2, 2], 0);
      doc.line(20, y, 280, y);
      addSpace(8);
      doc.setLineDashPattern([], 0);
      addSpace(6);
    };
    // Shop details
    doc.setFontSize(14);
    doc.text(shopDetails?.shopName || 'SHOP NAME', 150, y, { align: 'center' });
    addSpace(lineGap);
    doc.setFontSize(10);
    doc.text(shopDetails?.shopAddress || 'Shop Address', 150, y, { align: 'center' });
    addSpace(lineGap);
    dottedLine();
    // Table header
    doc.setFont(undefined, 'bold');
    doc.text('S.No', 30, y);
    doc.text('Bill No', 65, y);
    doc.text('Date & Time', 110, y);
    doc.text('Qty', 190, y);
    doc.text('Tax', 220, y);
    doc.text('Net Amt', 250, y);
    doc.setFont(undefined, 'normal');
    addSpace(lineGap - 2);
    dottedLine();
    // Table rows
    billsToPrint.forEach((bill, idx) => {
      doc.text(`${idx + 1}`, 30, y);
      doc.text(String(bill.billNo), 65, y);
      doc.text(new Date(bill.dateTime).toLocaleString(), 110, y, { maxWidth: 70 });
      doc.text(`${bill.qty}`, 190, y);
      doc.text(`${bill.tax.toFixed(2)}`, 220, y);
      doc.text(`${bill.netAmount.toFixed(2)}`, 250, y);
      addSpace(lineGap - 2);
    });
    dottedLine();
    // Footer
    doc.setFontSize(11);
    doc.text('Thank You, Visit again.', 150, y + 10, { align: 'center' });
    doc.save(fileName);
  };

  const handlePrint = () => {
    const selected = filteredBills.filter(bill => selectedBills.has(bill.id));
    if (selected.length === 0) return;
    printBillsReceipt(selected, 'BillWiseSales_Selected.pdf');
  };

  const handleExport = async () => {
    try {
      const selectedBillsData = filteredBills.filter(bill => selectedBills.has(bill.id));
      
      if (selectedBillsData.length === 0) {
        alert('Please select at least one bill to export');
        return;
      }

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for export
      const exportData = selectedBillsData.map(bill => ({
        'Bill No': bill.billNo,
        'Date & Time': new Date(bill.dateTime).toLocaleString(),
        'Payment Mode': bill.paymentMode,
        'Quantity': bill.qty,
        'Tax': bill.tax,
        'Net Amount': bill.netAmount
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const maxWidths: Record<string, number> = {};
      exportData.forEach(row => {
        Object.entries(row).forEach(([key, value]) => {
          const length = String(value).length;
          maxWidths[key] = Math.max(maxWidths[key] || 0, length);
        });
      });
      
      ws['!cols'] = Object.values(maxWidths).map(width => ({
        wch: Math.min(Math.max(width, 10), 50)
      }));
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Bill Wise Sales');
      
      // Generate and download file
      const fileName = `bill_wise_sales_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      // Removed the success alert as requested by user
    } catch (error) {
      console.error('Error exporting bills:', error);
      alert('Error exporting bills. Please try again.');
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
          Bill Wise
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
                    <td className="px-6 py-4 text-center">{bill.billNo}</td>
                    <td className="px-6 py-4 text-center">{new Date(bill.dateTime).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">{bill.paymentMode}</td>
                    <td className="px-6 py-4 text-center">₹{bill.tax.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">{bill.qty}</td>
                    <td className="px-6 py-4 text-center">₹{bill.netAmount.toFixed(2)}</td>
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

export default BillWiseSales; 