import React, { useState, useEffect } from 'react';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dishData: { name: string; price: number; isVeg: boolean; category: string; barcode?: string }) => void;
}

const AddDishModal: React.FC<AddDishModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState<boolean>(true);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
      const response = await fetch('http://localhost:5000/api/menu-items', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const items = await response.json();
      const uniqueCategories = Array.from(new Set(items.map((item: { category: string }) => item.category)));
      setCategories(uniqueCategories as string[]);
      if (uniqueCategories.length > 0) {
        setCategory(uniqueCategories[0] as string);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (dishName.trim() && price && category) {
      onAdd({
        name: dishName.trim(),
        price: Number(price),
        isVeg,
        category,
        barcode: barcode.trim() || undefined
      });
      setDishName('');
      setPrice('');
      setIsVeg(true);
      setCategory(categories[0] || '');
      setBarcode('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h2 className="text-2xl font-bold mb-6">Add New Dish</h2>
        
        <div className="mb-4">
          <label className="block mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            New Dish Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="Enter Dish name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter Price"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2">
            Veg/Non Veg
          </label>
          <select
            value={isVeg ? "veg" : "nonveg"}
            onChange={(e) => setIsVeg(e.target.value === "veg")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          >
            <option value="veg">Veg</option>
            <option value="nonveg">Non Veg</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-2">
            Barcode (Optional)
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode for scanning"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            💡 Add a barcode to enable quick scanning during billing
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal; 