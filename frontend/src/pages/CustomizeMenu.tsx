import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddCategoryModal from '../components/modals/AddCategoryModal';
import AddDishModal from '../components/modals/AddDishModal';

interface MenuItem {
  _id: string;
  category: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
}

const CustomizeMenu: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const filtered = menuItems.filter(
      item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [searchQuery, menuItems]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu-items');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: categoryName,
          name: `${categoryName} Default Item`,
          price: 0,
          isVeg: true,
        }),
      });
      
      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddDish = async (dishData: { name: string; price: number; isVeg: boolean; category: string }) => {
    try {
      const response = await fetch('http://localhost:5000/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dishData,
          isAvailable: true,
        }),
      });
      
      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error adding dish:', error);
    }
  };

  const toggleAvailability = async (itemId: string) => {
    try {
      const item = menuItems.find(item => item._id === itemId);
      if (!item) return;

      const response = await fetch(`http://localhost:5000/api/menu-items/${itemId}/toggle-availability`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/menu-items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Customize Menu</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Version 1.0
          </div>
          <div className="text-gray-600">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span>Add Category</span>
            <span className="text-xl">+</span>
          </button>
          <button
            onClick={() => setIsAddDishModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span>Add Dish</span>
            <span className="text-xl">+</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">S.No</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Category</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Price ₹</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Veg/Non-Veg</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Availability</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {getCurrentPageItems().map((item, index) => (
              <tr key={item._id}>
                <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-6 py-4">{item.category}</td>
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">{item.price}</td>
                <td className="px-6 py-4">{item.isVeg ? 'Veg' : 'Non Veg'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleAvailability(item._id)}
                    className={`w-12 h-6 rounded-full relative ${
                      item.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        item.isAvailable ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button className="text-gray-600 hover:text-gray-800">
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-lg disabled:opacity-50"
        >
          ←
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 border rounded-lg ${
              currentPage === page ? 'bg-green-500 text-white' : ''
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded-lg disabled:opacity-50"
        >
          →
        </button>
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAdd={handleAddCategory}
      />
      <AddDishModal
        isOpen={isAddDishModalOpen}
        onClose={() => setIsAddDishModalOpen(false)}
        onAdd={handleAddDish}
      />
    </div>
  );
};

export default CustomizeMenu; 