import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface AddMissingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  onItemAdded: (item: any) => void;
}

const AddMissingItemModal: React.FC<AddMissingItemModalProps> = ({
  isOpen,
  onClose,
  barcode,
  onItemAdded
}) => {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Fetch existing categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingCategories();
    }
  }, [isOpen]);

  const fetchExistingCategories = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
      const response = await fetch('http://localhost:5000/api/menu-items', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const items = await response.json();

      // Extract unique categories
      const categories = [...new Set(items.map((item: any) => item.category))];
      setExistingCategories(categories);

      // Set default category if available
      if (categories.length > 0 && !category) {
        setCategory(categories[0]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim() || !price.trim() || !category.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const newItem = await api.addMenuItem({
        name: itemName.trim(),
        price: priceNum,
        category: category.trim(),
        isVeg: isVeg,
        barcode: barcode,
        isAvailable: true
      });

      console.log('New item created:', newItem);
      onItemAdded(newItem);
      handleClose();
    } catch (error: any) {
      console.error('Error adding new item:', error);
      alert(`Error adding item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setItemName('');
    setPrice('');
    setCategory('');
    setIsVeg(true);
    setIsNewCategory(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Scanned Barcode:</div>
          <div className="text-lg font-mono text-blue-800">{barcode}</div>
          <div className="text-xs text-blue-600 mt-1">
            This barcode will be automatically assigned to the new item
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (Rs.) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            {!isNewCategory ? (
              <div className="space-y-2">
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setIsNewCategory(true);
                      setCategory('');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__new__">+ Add New Category</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new category name"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCategory(false);
                    setCategory(existingCategories[0] || '');
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  ← Back to existing categories
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="foodType"
                  checked={isVeg}
                  onChange={() => setIsVeg(true)}
                  className="mr-2"
                />
                <span className="text-green-600">🟢 Vegetarian</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="foodType"
                  checked={!isVeg}
                  onChange={() => setIsVeg(false)}
                  className="mr-2"
                />
                <span className="text-red-600">🔴 Non-Vegetarian</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Item & Continue'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          💡 After adding, the item will be automatically added to your current bill
        </div>
      </div>
    </div>
  );
};

export default AddMissingItemModal;
