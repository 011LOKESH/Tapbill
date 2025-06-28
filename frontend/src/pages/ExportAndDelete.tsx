import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface DataItem {
  id: string;
  type: 'daySummary' | 'billSales' | 'deletedItems' | 'deletedBill';
  title: string;
  description: string;
  headers: string[];
}

interface DateRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

// Helper function to get auth headers (same as in api.ts)
function getAuthHeaders() {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const ExportAndDelete: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '23:59'
  });
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    free: 100,
    totalSizeMB: 0,
    totalSizeKB: 0,
    storageLimit: 100
  });

  // Fetch storage information on component mount
  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/export/storageInfo', {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch storage info');
        const data = await response.json();
        setStorageInfo(data);
      } catch (error) {
        console.error('Error fetching storage info:', error);
      }
    };

    fetchStorageInfo();
  }, []);

  const dataItems: DataItem[] = [
    {
      id: 'daySummary',
      type: 'daySummary',
      title: 'Day Summary',
      description: 'A brief breakdown of daily transactions.',
      headers: ['Date', 'Number of Bills', 'Tax', 'Total Sales'],
    },
    {
      id: 'billSales',
      type: 'billSales',
      title: 'Bill Sales',
      description: 'Analyze bill trends and patterns.',
      headers: ['Bill No', 'Date', 'Payment Mode', 'Items', 'Tax', 'Total Amount'],
    },
    {
      id: 'deletedItems',
      type: 'deletedItems',
      title: 'Deleted Items',
      description: 'Overview of removed products from the inventory.',
      headers: ['Item Name', 'Category', 'Price', 'Deleted At'],
    },
    {
      id: 'deletedBill',
      type: 'deletedBill',
      title: 'Deleted Bill',
      description: 'Details of bills that have been deleted.',
      headers: ['Bill No', 'Date & Time', 'Payment Mode', 'Quantity', 'Net Amount', 'Deleted At'],
    },
  ];

  const handleDateChange = (date: 'today' | 'yesterday' | 'custom') => {
    setSelectedDate(date);
    setSelectedItems([]);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === dataItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(dataItems.map(item => item.id));
    }
  };

  const handleDateRangeChange = (field: keyof DateRange, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchExportData = async () => {
    const data: Record<string, any[]> = {};
    
    for (const itemId of selectedItems) {
      try {
        if (itemId === 'billSales') {
          // For billSales, we can use the existing endpoint with dateRange
          const response = await fetch(`http://localhost:5000/api/export/billSales`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              dateRange: selectedDate === 'custom' ? dateRange : undefined,
              dateType: selectedDate
            })
          });
          
          if (!response.ok) throw new Error('Failed to fetch data');
          
          const responseData = await response.json();
          if (Array.isArray(responseData) && responseData.length > 0) {
            data[itemId] = responseData;
          } else {
            console.warn(`No data found for ${itemId}`);
            data[itemId] = [];
          }
        } else if (itemId === 'deletedBill') {
          // For deletedBills, fetch the data and format it for Excel
          let url = 'http://localhost:5000/api/deleted-bills';
          const response = await fetch(url, {
            headers: getAuthHeaders(),
          });
          
          if (!response.ok) throw new Error('Failed to fetch deleted bills');
          
          const billsData = await response.json();
          
          // Filter bills based on date selection
          const filteredBills = filterBillsByDate(billsData);
          
          // Format the data for Excel export
          const formattedBills = filteredBills.map((bill: any) => ({
            'Bill No': bill.billNo || bill._id,
            'Date & Time': format(new Date(bill.createdAt), 'yyyy-MM-dd HH:mm:ss'),
            'Payment Mode': bill.paymentMode || 'Cash',
            'Quantity': bill.items?.length || 0,
            'Net Amount': bill.total,
            'Deleted At': format(new Date(bill.deletedAt), 'yyyy-MM-dd HH:mm:ss')
          }));
          
          data[itemId] = formattedBills;
        } else if (itemId === 'deletedItems') {
          // For deletedItems, fetch the data and format it for Excel
          let url = 'http://localhost:5000/api/menu-items/deleted';
          if (selectedDate === 'custom' && dateRange.startDate && dateRange.endDate) {
            url += `?dateFilter=custom&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          } else {
            url += `?dateFilter=${selectedDate}`;
          }
          
          const response = await fetch(url, {
            headers: getAuthHeaders(),
          });
          
          if (!response.ok) throw new Error('Failed to fetch deleted items');
          
          const itemsData = await response.json();
          
          // Format the data for Excel export
          const formattedItems = itemsData.map((item: any) => ({
            'Item Name': item.name,
            'Category': item.category,
            'Price': item.price,
            'Deleted At': format(new Date(item.deletedAt), 'yyyy-MM-dd HH:mm:ss')
          }));
          
          data[itemId] = formattedItems;
        } else if (itemId === 'daySummary') {
          const response = await fetch(`http://localhost:5000/api/export/daySummary`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              dateRange: selectedDate === 'custom' ? dateRange : undefined,
              dateType: selectedDate
            })
          });
          
          if (!response.ok) throw new Error('Failed to fetch data');
          
          const responseData = await response.json();
          if (Array.isArray(responseData) && responseData.length > 0) {
            data[itemId] = responseData;
          } else {
            console.warn(`No data found for ${itemId}`);
            data[itemId] = [];
          }
        }
      } catch (error) {
        console.error(`Error fetching data for ${itemId}:`, error);
        data[itemId] = [];
      }
    }
    
    return data;
  };

  // Helper function to filter bills by date (similar to DeletedBills.tsx)
  const filterBillsByDate = (bills: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (selectedDate) {
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
        if (dateRange.startDate && dateRange.endDate) {
          const start = new Date(dateRange.startDate + 'T' + (dateRange.startTime || '00:00'));
          const end = new Date(dateRange.endDate + 'T' + (dateRange.endTime || '23:59'));
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

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to export');
      return;
    }

    try {
      // Fetch data based on selected items and date range
      const exportData = await fetchExportData();
      
      // Create Excel workbook for all data
      const wb = XLSX.utils.book_new();
      
      // Add each selected item's data as a separate sheet
      selectedItems.forEach(itemId => {
        const item = dataItems.find(i => i.id === itemId);
        if (item && exportData[itemId]) {
          // Convert data to worksheet. json_to_sheet will infer headers.
          const ws = XLSX.utils.json_to_sheet(exportData[itemId]);

          if (exportData[itemId].length === 0) {
            // If no data, create a sheet with just the headers
            XLSX.utils.sheet_add_aoa(ws, [item.headers], { origin: 'A1' });
          }

          // Set column widths based on content
          const colWidths = item.headers.map((header, index) => {
            const headerLength = header.length;
            const dataLengths = exportData[itemId].map(row => {
              const value = Object.values(row)[index];
              return value ? String(value).length : 0;
            });
            const maxLength = Math.max(headerLength, ...dataLengths);
            return { wch: Math.min(Math.max(maxLength, 10), 50) };
          });
          
          ws['!cols'] = colWidths;
          
          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(wb, ws, item.title);
        }
      });

      // Check if any data was added to the workbook
      if (wb.SheetNames.length === 0) {
        alert('No data available to export for the selected items and date range');
        return;
      }

      // Generate Excel file
      const fileName = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the selected data for ${selectedDate === 'custom' ? 'the selected date range' : selectedDate}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const deletePromises = selectedItems.map(async (itemId) => {
        if (itemId === 'billSales') {
          // Delete bills by date range
          const response = await fetch('http://localhost:5000/api/bill-items/deleteByDateRange', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              dateRange: selectedDate === 'custom' ? dateRange : undefined,
              dateType: selectedDate
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete bill sales: ${response.statusText}`);
          }
          
          const result = await response.json();
          return { type: 'billSales', result };
        } else if (itemId === 'deletedBill') {
          // Clear all deleted bills
          const response = await fetch('http://localhost:5000/api/deleted-bills/clear', {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to clear deleted bills: ${response.statusText}`);
          }
          
          const result = await response.json();
          return { type: 'deletedBill', result };
        } else if (itemId === 'deletedItems') {
          // Clear all deleted items
          const response = await fetch('http://localhost:5000/api/menu-items/clearDeleted', {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to clear deleted items: ${response.statusText}`);
          }
          
          const result = await response.json();
          return { type: 'deletedItems', result };
        } else if (itemId === 'daySummary') {
          // Day summary is just a report, nothing to delete
          return { type: 'daySummary', result: { message: 'Day summary is a report only, nothing to delete' } };
        }
      });

      const results = await Promise.all(deletePromises);
      
      // Show results
      const successCount = results.filter(r => r && r.result && !r.result.error).length;
      const totalCount = results.length;
      
      alert(`Delete operation completed. ${successCount} out of ${totalCount} operations were successful.`);
      
      // Clear selections
      setSelectedItems([]);
      
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg"
        >
          ←
        </button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Export & Delete
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">Version 1.0</div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {format(new Date(), "yyyy.MM.dd HH:mm")}
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Date Range</h2>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleDateChange('today')}
            className={`px-4 py-2 rounded-lg ${
              selectedDate === 'today'
                ? 'bg-[rgb(56,224,120)] text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            Today's
          </button>
          <button
            onClick={() => handleDateChange('yesterday')}
            className={`px-4 py-2 rounded-lg ${
              selectedDate === 'yesterday'
                ? 'bg-[rgb(56,224,120)] text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            Yesterday's
          </button>
          <button
            onClick={() => handleDateChange('custom')}
            className={`px-4 py-2 rounded-lg ${
              selectedDate === 'custom'
                ? 'bg-[rgb(56,224,120)] text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            Date Custom
          </button>
        </div>

        {selectedDate === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={dateRange.startTime}
                onChange={(e) => handleDateRangeChange('startTime', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={dateRange.endTime}
                onChange={(e) => handleDateRangeChange('endTime', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Items */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Select Data to Export/Delete</h2>
          <button
            onClick={handleSelectAll}
            className="text-sm text-[rgb(56,224,120)] hover:underline"
          >
            {selectedItems.length === dataItems.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border cursor-pointer ${
                selectedItems.includes(item.id)
                  ? 'border-[rgb(56,224,120)] bg-[rgba(56,224,120,0.1)]'
                  : 'border-gray-200'
              }`}
              onClick={() => handleItemSelect(item.id)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemSelect(item.id)}
                  className="mt-1"
                />
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Information Section */}
      <div className="mt-8 mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Database Storage</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Used Space</span>
              <span className="text-sm">{storageInfo.used}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${storageInfo.used}%` }}
              ></div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Total Used: {storageInfo.totalSizeMB} MB ({storageInfo.totalSizeKB.toFixed(2)} KB) / {storageInfo.storageLimit} MB</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-[rgb(56,224,120)] text-white rounded-lg hover:bg-[rgb(46,204,110)]"
        >
          Export
        </button>
        <button
          onClick={handleDelete}
          className="px-6 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ExportAndDelete; 