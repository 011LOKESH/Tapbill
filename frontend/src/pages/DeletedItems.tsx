import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { api, ShopDetails } from '@/services/api';
import { printReport, ReportData } from '@/services/printService';
import PrinterConfigService from '@/services/printerConfig';

interface DeletedItem {
  _id: string;
  category: string;
  name: string;
  price: number;
  isVeg: boolean;
  deletedAt: string;
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

const DeletedItems: React.FC = () => {
  const navigate = useNavigate();
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DeletedItem[]>([]);
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
    fetchDeletedItems();
    api.getShopDetails().then(setShopDetails);
  }, [dateFilter, customDateRange]);

  const fetchDeletedItems = async () => {
    try {
      let url = 'http://localhost:5000/api/menu-items/deleted';
      if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        url += `?dateFilter=custom&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
      } else {
        url += `?dateFilter=${dateFilter}`;
      }
      
      console.log('Fetching deleted items from:', url);
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received data:', data);
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of items');
      }
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
      setItems([]);
      setFilteredItems([]);
    }
  };

  const handleBack = () => {
    navigate('/report');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.price.toString().includes(query)
    );
    setFilteredItems(filtered);
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
      const allIds = new Set(filteredItems.map(item => item._id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleRestore = async () => {
    try {
      const restorePromises = Array.from(selectedItems).map(async (id) => {
        const response = await fetch(`http://localhost:5000/api/menu-items/${id}/restore`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`Failed to restore item: ${id}`);
        }
      });

      await Promise.all(restorePromises);
      fetchDeletedItems();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error restoring items:', error);
    }
  };

  const handleExport = async () => {
    try {
      const selectedItemsData = filteredItems.filter(item => selectedItems.has(item._id));
      
      if (selectedItemsData.length === 0) {
        alert('Please select at least one item to export');
        return;
      }

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for export with all required fields
      const exportData = selectedItemsData.map(item => ({
        'Category': item.category,
        'Name': item.name,
        'Price': item.price,
        'Type': item.isVeg ? 'Veg' : 'Non-Veg',
        'Deleted At': new Date(item.deletedAt).toLocaleString()
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
      XLSX.utils.book_append_sheet(wb, ws, 'Deleted Items');
      
      // Generate and download file
      const fileName = `deleted_items_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting items:', error);
      alert('Error exporting items. Please try again.');
    }
  };

  const printDeletedItemsReceipt = (itemsToPrint: DeletedItem[], fileName = 'DeletedItems.pdf') => {
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
    doc.text('Deleted Items Report', layout.centerX, y, { align: 'center' });
    addSpace();
    // Format current date and time as DD/MM/YYYY HH:MM
    const currentDate = new Date();
    const formattedDateTime = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth()+1).toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
    doc.text(formattedDateTime, layout.centerX, y, { align: 'center' });
    addSpace();
    dottedLine();

    // Table headers (no S.No column)
    doc.setFontSize(layout.itemFontSize);
    doc.text('Name', layout.columns.item, y);
    doc.text('Price', layout.columns.qty, y);
    doc.text('Type', layout.columns.price, y);
    doc.text('Date', layout.columns.total, y);
    addSpace();
    dottedLine();

    // Table rows (no S.No column)
    itemsToPrint.forEach((item) => {
      // Format deleted date as DD/MM/YYYY
      const deletedDate = new Date(item.deletedAt);
      const formattedDate = `${deletedDate.getDate().toString().padStart(2, '0')}/${(deletedDate.getMonth()+1).toString().padStart(2, '0')}/${deletedDate.getFullYear()}`;
      doc.text(item.name, layout.columns.item, y, { maxWidth: layout.columnWidths.item });
      doc.text(String(item.price.toFixed(0)), layout.columns.qty, y);
      doc.text(item.isVeg ? 'Veg' : 'Non-V', layout.columns.price, y);
      doc.text(formattedDate, layout.columns.total, y, { maxWidth: layout.columnWidths.total });
      addSpace();
    });
    dottedLine();

    // Footer
    doc.setFontSize(layout.bodyFontSize);
    addSpace(layout.sectionSpacing);
    doc.text('Thank You, Visit again.', layout.centerX, y, { align: 'center' });

    // Save PDF with printer width in filename
    const thermalFileName = fileName.replace('.pdf', `_${printerSettings.selectedWidth}.pdf`);
    doc.save(thermalFileName);
  };

  const handlePrint = async () => {
    const selected = filteredItems.filter(item => selectedItems.has(item._id));
    if (selected.length === 0) {
      alert('Please select items to print');
      return;
    }

    // Prepare report data for direct printing
    const reportData: ReportData = {
      title: 'Deleted Items Report',
      date: new Date().toLocaleDateString(),
      items: selected.map(item => ({
        'Name': item.name,
        'Price': `₹${item.price.toFixed(2)}`,
        'Category': item.category,
        'Type': item.isVeg ? 'Veg' : 'Non-Veg',
        'Deleted': new Date(item.deletedAt).toLocaleDateString()
      })),
      totals: {
        'Total Items': selected.length,
        'Veg Items': selected.filter(item => item.isVeg).length,
        'Non-Veg Items': selected.filter(item => !item.isVeg).length
      }
    };

    // Try direct printing first
    let printSuccess = false;
    try {
      printSuccess = await printReport(reportData, { silent: true });
      if (printSuccess) {
        console.log('✅ Deleted items report printed successfully');
      }
    } catch (error) {
      console.error('Direct print error:', error);
    }

    // Always generate PDF as backup
    printDeletedItemsReceipt(selected, 'DeletedItems_Selected.pdf');

    // Show result message
    if (printSuccess) {
      alert('✅ Report printed successfully! PDF also saved as backup.');
    } else {
      alert('⚠️ Direct printing failed. PDF saved successfully.');
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={handleBack} className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg">←</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Deleted Items
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {format(new Date(), "d/M/yyyy, h:mm:ss a")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
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
          <div className="flex items-center mb-6">
            <div className="relative w-1/2">
              <input
                type="text"
                placeholder="Search by name, category, or price"
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
                onClick={handleRestore}
                className="bg-[rgb(56,224,120)] text-white h-10 px-6 rounded-lg mr-2"
              >
                Restore
              </button>
              <button 
                onClick={handleExport}
                className="bg-[#F5F5F5] text-black h-10 px-6 rounded-lg"
              >
                Export
              </button>
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
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      className="mx-auto h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Sr.No</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Category</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Name</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Price</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Type</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Deleted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedItems.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item._id)}
                        onChange={() => handleSelectItem(item._id)}
                        className="mx-auto h-4 w-4"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-center">{item.category}</td>
                    <td className="px-6 py-4 text-center">{item.name}</td>
                    <td className="px-6 py-4 text-center">₹{item.price}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isVeg
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.isVeg ? "Veg" : "Non-Veg"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {format(new Date(item.deletedAt), "d/M/yyyy, h:mm:ss a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-4">
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
      {isDateFilterOpen && (
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

export default DeletedItems; 