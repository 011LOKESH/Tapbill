import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface DataItem {
  id: string;
  type: 'daySummary' | 'billSales' | 'deletedItems' | 'deletedBill';
  title: string;
  description: string;
}

const ExportAndDelete: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customDate, setCustomDate] = useState<string>('');
  const [storageInfo, setStorageInfo] = useState({
    used: 75, // Example value in percentage
    free: 25, // Example value in percentage
  });

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
      id: 'deletedBill',
      type: 'deletedBill',
      title: 'Deleted Bill',
      description: 'Details of bills that have been deleted.',
    },
  ];

  const handleDateChange = (date: 'today' | 'yesterday' | 'custom') => {
    setSelectedDate(date);
    // Reset selected items when changing date
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

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to export');
      return;
    }
    // TODO: Implement export functionality
    console.log('Exporting items:', selectedItems);
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to delete');
      return;
    }
    // TODO: Implement delete functionality
    console.log('Deleting items:', selectedItems);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Date Selection */}
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
          {selectedDate === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200"
            />
          )}
        </div>

        {/* Data Items */}
        <div className="bg-white rounded-xl p-6 mb-6">
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
                className={`p-4 rounded-lg border ${
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

        {/* Storage Info */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Storage Usage</h2>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[rgb(56,224,120)]"
              style={{ width: `${storageInfo.used}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Used: {storageInfo.used}%</span>
            <span>Free: {storageInfo.free}%</span>
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
    </div>
  );
};

export default ExportAndDelete; 