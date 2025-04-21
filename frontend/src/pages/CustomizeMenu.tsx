import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AddCategoryModal from '../components/modals/AddCategoryModal';
import AddDishModal from '../components/modals/AddDishModal';

interface MenuItem {
  _id: string;
  category: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

const CustomizeMenu: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
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
      // Fetch all menu items including unavailable ones
      const response = await fetch("http://localhost:5000/api/menu-items/all");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      setMenuItems(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((item: MenuItem) => item.category))] as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setMenuItems([]); // Set empty array on error
      setCategories([]);
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
          isDeleted: false
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
          isDeleted: false
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: !item.isAvailable
        })
      });
      
      if (response.ok) {
        // Update the local state immediately
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item._id === itemId 
              ? { ...item, isAvailable: !item.isAvailable }
              : item
          )
        );
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
        // Update local state to remove the item
        setMenuItems(prevItems => prevItems.filter(item => item._id !== itemId));
        setFilteredItems(prevItems => prevItems.filter(item => item._id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleUpdate = async (updatedItem: MenuItem) => {
    try {
      const response = await fetch(`http://localhost:5000/api/menu-items/${updatedItem._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });
      setShowEditModal(false);
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

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
          Customize Menu
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">Version 1.0</div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {format(new Date(), "d/M/yyyy, h:mm:ss a")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(56,224,120)]"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] border border-gray-200 rounded-xl hover:bg-gray-100"
            >
              <span>Add Category</span>
              <span className="text-xl">+</span>
            </button>
            <button
              onClick={() => setIsAddDishModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] border border-gray-200 rounded-xl hover:bg-gray-100"
            >
              <span>Add Dish</span>
              <span className="text-xl">+</span>
            </button>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentPageItems().map((item) => (
                <tr key={item._id} className={!item.isAvailable ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{item.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => toggleAvailability(item._id)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: item.isAvailable ? 'rgb(56,224,120)' : '#D1D5DB' }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-900 hover:text-gray-700 mr-4"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-gray-900 hover:text-gray-700"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
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
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Menu Item</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(editingItem);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(56,224,120)] focus:ring-[rgb(56,224,120)]"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(56,224,120)] focus:ring-[rgb(56,224,120)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(56,224,120)] focus:ring-[rgb(56,224,120)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={editingItem.isVeg ? "veg" : "non-veg"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        isVeg: e.target.value === "veg",
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(56,224,120)] focus:ring-[rgb(56,224,120)]"
                  >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={editingItem.isAvailable ? "available" : "unavailable"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        isAvailable: e.target.value === "available",
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(56,224,120)] focus:ring-[rgb(56,224,120)]"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[rgb(56,224,120)] hover:bg-[rgb(46,204,110)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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