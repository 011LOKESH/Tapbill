import React, { useState, useEffect } from "react";

interface MenuItem {
  _id: string;
  category: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

interface MenuCategoriesProps {
  onItemClick: (name: string, price: number) => void;
}

const MenuCategories: React.FC<MenuCategoriesProps> = ({ onItemClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tiffin");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
      const response = await fetch('http://localhost:5000/api/menu-items', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const items: MenuItem[] = await response.json();
      
      // Group items by category
      const groupedItems = items.reduce((acc: { [key: string]: MenuItem[] }, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});

      // Convert to array format
      const categoriesArray = Object.entries(groupedItems).map(([name, items]) => ({
        name,
        items,
      }));

      setCategories(categoriesArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setLoading(false);
    }
  };

  const getCurrentItems = () => {
    return categories.find(cat => cat.name === selectedCategory)?.items || [];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex gap-4">
      <div className="w-48 flex flex-col gap-2">
        <div className="text-lg font-bold mb-2">Select a Category</div>
        {categories.map((category, index) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === category.name
                ? "bg-[rgb(245,245,245)] text-black border-2 border-gray-300"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-sm">
              {index + 1}
            </span>
            {category.name}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-3 gap-4">
          {getCurrentItems().map((item) => (
            <button
              key={item._id}
              onClick={() => onItemClick(item.name, item.price)}
              className="w-[166px] h-[166px] bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="font-bold text-center">{item.name}</div>
              <div className="text-center">₹{item.price}</div>
              <div className={`w-4 h-4 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuCategories; 