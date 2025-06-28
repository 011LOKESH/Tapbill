import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BarcodeService } from '@/services/barcodeService';

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  barcode?: string;
  isVeg: boolean;
  isAvailable: boolean;
}

interface BarcodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeUpdated?: () => void;
}

const BarcodeManager: React.FC<BarcodeManagerProps> = ({ 
  isOpen, 
  onClose, 
  onBarcodeUpdated 
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newBarcode, setNewBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'with-barcode' | 'without-barcode'>('all');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      // Use fetch API directly like other components
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/menu-items/all`, {
        headers: {
          'Content-Type': 'application/json',
          ...(JSON.parse(localStorage.getItem('userSession') || 'null')?.token
            ? { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userSession') || 'null').token}` }
            : {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      alert('Error loading menu items');
    } finally {
      setLoading(false);
    }
  };

  const updateBarcode = async (itemId: string, barcode: string) => {
    try {
      // Use BarcodeService for consistent API handling
      const result = await BarcodeService.updateItemBarcode(itemId, barcode);

      if (result.success) {
        // Update local state
        setMenuItems(prev => prev.map(item =>
          item._id === itemId
            ? { ...item, barcode: barcode.trim() || undefined }
            : item
        ));

        setEditingItem(null);
        setNewBarcode('');

        if (onBarcodeUpdated) {
          onBarcodeUpdated();
        }

        // Show success message
        setSuccessMessage('Barcode updated successfully!');
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 3000);
        console.log('Barcode updated:', result.message);
      } else {
        // Show duplicate barcode error message (non-blocking)
        setErrorMessage(result.message);
        setSuccessMessage('');
        setTimeout(() => setErrorMessage(''), 5000);
        console.error('Barcode update failed:', result.message);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error updating barcode');
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 5000);
      console.error('Error updating barcode:', error);
    }
  };

  const handleSaveBarcode = (itemId: string) => {
    if (newBarcode.trim().length < 3) {
      setErrorMessage('Barcode must be at least 3 characters long');
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    updateBarcode(itemId, newBarcode);
  };

  const handleRemoveBarcode = (itemId: string) => {
    if (confirm('Remove barcode from this item?')) {
      updateBarcode(itemId, '');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.barcode && item.barcode.includes(searchTerm));
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'with-barcode' && item.barcode) ||
                         (filter === 'without-barcode' && !item.barcode);
    
    return matchesSearch && matchesFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Barcode Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="with-barcode">With Barcode</option>
            <option value="without-barcode">Without Barcode</option>
          </select>
        </div>

        {/* Items List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.category} • ₹{item.price}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingItem === item._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newBarcode}
                            onChange={(e) => setNewBarcode(e.target.value)}
                            placeholder="Enter barcode"
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveBarcode(item._id)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setNewBarcode('');
                            }}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {item.barcode ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                                {item.barcode}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingItem(item._id);
                                  setNewBarcode(item.barcode || '');
                                }}
                                className="text-blue-500 hover:text-blue-700 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveBarcode(item._id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingItem(item._id);
                                setNewBarcode('');
                              }}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                              Add Barcode
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No items found matching your criteria
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Total items: {filteredItems.length} | 
          With barcodes: {filteredItems.filter(item => item.barcode).length} | 
          Without barcodes: {filteredItems.filter(item => !item.barcode).length}
        </div>
      </div>
    </div>
  );
};

export default BarcodeManager;
