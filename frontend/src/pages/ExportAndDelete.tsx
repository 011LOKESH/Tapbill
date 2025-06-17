import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface DataItem {
  id: string;
  type: 'daySummary' | 'billSales' | 'deletedItems' | 'deletedBills';
  title: string;
  description: string;
}

interface DateRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
          headers: getAuthHeaders(),
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
    },
    {
      id: 'billSales',
      type: 'billSales',
      title: 'Bill Sales',
      description: 'Analyze bill trends and patterns.',
    },
    {
      id: 'deletedItems',
      type: 'deletedItems',
      title: 'Deleted Items',
      description: 'Overview of removed products from the inventory.',
    },
    {
      id: 'deletedBills',
      type: 'deletedBills',
      title: 'Deleted Bills',
      description: 'Details of bills that have been deleted.',
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
        // Map the itemId to the correct endpoint
        const endpointMap: Record<string, string> = {
          'daySummary': '/api/export/daySummary',
          'billSales': '/api/export/billSales',
          'deletedItems': '/api/export/deletedItems'
          // Note: deletedBills is handled directly in handleExport, not here
        };

        const endpoint = endpointMap[itemId];
        if (!endpoint) {
          console.warn(`No endpoint found for ${itemId}`);
          continue;
        }

        // For daySummary and deletedItems, we need to handle them differently
        // as they return Excel files directly, not JSON data
        if (itemId === 'daySummary' || itemId === 'deletedItems') {
          // These endpoints return Excel files directly, so we'll skip them
          // and handle them separately in the export function
          console.log(`Skipping ${itemId} as it returns Excel file directly`);
          continue;
        }

        const response = await fetch(`http://localhost:5000${endpoint}`, {
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
      } catch (error) {
        console.error(`Error fetching data for ${itemId}:`, error);
        data[itemId] = [];
      }
    }
    
    return data;
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to export');
      return;
    }

    try {
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Process each selected item
      for (const itemId of selectedItems) {
        try {
          let sheetData;
          let sheetName;
          
          if (itemId === 'daySummary') {
            // For day summary, fetch bills and calculate summary
            const salesResponse = await fetch('http://localhost:5000/api/bill-items', {
              headers: getAuthHeaders(),
            });
            if (!salesResponse.ok) continue;
            
            const bills = await salesResponse.json();
            
            // Group bills by date and calculate summary
            const salesByDate = bills.reduce((acc, bill) => {
              const date = new Date(bill.createdAt).toDateString();
              if (!acc[date]) {
                acc[date] = {
                  date: new Date(bill.createdAt),
                  numberOfBills: 0,
                  tax: 0,
                  totalSale: 0
                };
              }
              acc[date].numberOfBills += 1;
              acc[date].tax += bill.total * 0.1;
              acc[date].totalSale += bill.total;
              return acc;
            }, {});
            
            const sales = Object.values(salesByDate);
            sheetData = sales.map(sale => ({
              'Date': format(new Date(sale.date), 'yyyy-MM-dd'),
              'Number of Bills': sale.numberOfBills,
              'Tax': sale.tax,
              'Total Sales': sale.totalSale
            }));
            sheetName = 'Day Summary';
            
          } else if (itemId === 'deletedItems') {
            // For deleted items, fetch the deleted items data
            const itemsResponse = await fetch('http://localhost:5000/api/menu-items/deleted', {
              headers: getAuthHeaders(),
            });
            if (!itemsResponse.ok) continue;
            
            const items = await itemsResponse.json();
            sheetData = items.map(item => ({
              'Item Name': item.name,
              'Category': item.category,
              'Price': item.price,
              'Deleted At': new Date(item.deletedAt).toLocaleString()
            }));
            sheetName = 'Deleted Items';
            
          } else if (itemId === 'deletedBills') {
            // For deleted bills, fetch the deleted bills data
            const billsResponse = await fetch('http://localhost:5000/api/deleted-bills', {
              headers: getAuthHeaders(),
            });
            if (!billsResponse.ok) continue;
            
            const bills = await billsResponse.json();
            sheetData = bills.map(bill => ({
              'Bill No': bill.billNo,
              'Date & Time': new Date(bill.createdAt).toLocaleString(),
              'Payment Mode': bill.paymentMode,
              'Quantity': bill.items ? bill.items.length : 0,
              'Net Amount': bill.total
            }));
            sheetName = 'Deleted Bills';
            
          } else if (itemId === 'billSales') {
            // For bill sales, use the existing fetchExportData method
            const exportData = await fetchExportData();
            console.log("Bill Sales exportData:", exportData[itemId]);
            if (exportData[itemId] && exportData[itemId].length > 0) {
              sheetData = exportData[itemId].map(bill => ({
                'Bill No': bill['Bill No'],
                'Date & Time': new Date(bill['Date']).toLocaleString(),
                'Payment Mode': bill['Payment Mode'],
                'Quantity': bill['Items'] ? bill['Items'].split(',').length : 0,
                'Tax': bill['Tax'],
                'Net Amount': bill['Total Amount']
              }));
              sheetName = 'Bill Sales';
            }
          }

          // Add sheet to workbook if we have data
          if (sheetData && sheetData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(sheetData);
          
          // Set column widths based on content
          const maxWidths: Record<string, number> = {};
            sheetData.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
              const length = String(value).length;
              maxWidths[key] = Math.max(maxWidths[key] || 0, length);
            });
          });
          
          ws['!cols'] = Object.values(maxWidths).map(width => ({
            wch: Math.min(Math.max(width, 10), 50) // Min width 10, max width 50
          }));
          
          // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }
          
        } catch (error) {
          console.error(`Error processing ${itemId}:`, error);
        }
      }

      // Check if any data was added to the workbook
      if (wb.SheetNames.length === 0) {
        alert('No data available to export for the selected items and date range');
        return;
      }

      // Generate single Excel file with all sheets
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

    const confirmed = window.confirm('Are you sure you want to delete the selected data? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      for (const itemId of selectedItems) {
        try {
          if (itemId === 'billSales') {
            // Delete bills within the date range
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

            if (response.ok) {
              console.log('Bills deleted successfully');
            } else {
              console.error('Failed to delete bills');
            }
          } else if (itemId === 'deletedItems') {
            // Clear deleted items (this would need a backend endpoint)
            const response = await fetch('http://localhost:5000/api/menu-items/clearDeleted', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
              }
            });

            if (response.ok) {
              console.log('Deleted items cleared successfully');
            } else {
              console.error('Failed to clear deleted items');
            }
          } else if (itemId === 'deletedBills') {
            // Clear deleted bills
            const response = await fetch('http://localhost:5000/api/deleted-bills/clear', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
              }
            });

            if (response.ok) {
              console.log('Deleted bills cleared successfully');
            } else {
              console.error('Failed to clear deleted bills');
            }
          } else if (itemId === 'daySummary') {
            // For day summary, we don't actually delete data, just clear the summary
            console.log('Day summary data cannot be deleted as it is calculated from existing bills');
          }
        } catch (error) {
          console.error(`Error deleting ${itemId}:`, error);
        }
      }

      alert('Delete operation completed. Please refresh the page to see updated data.');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again.');
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