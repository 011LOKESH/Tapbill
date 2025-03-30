import React, { useState } from "react";

interface MenuItem {
  name: string;
  price: number;
}

interface MenuCategory {
  id: number;
  name: string;
  items: MenuItem[];
}

interface MenuCategoriesProps {
  onItemClick: (item: MenuItem) => void;
}

const MenuCategories: React.FC<MenuCategoriesProps> = ({ onItemClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tiffin");

  const categories: MenuCategory[] = [
    {
      id: 1,
      name: "Tiffin",
      items: [
        { name: "Idly", price: 10 },
        { name: "Pongal", price: 20 },
        { name: "Poori", price: 20 },
        { name: "Chola Poori", price: 40 },
        { name: "Uthapam", price: 15 },
        { name: "Roast", price: 40 },
        { name: "Masala Roast", price: 40 },
        { name: "Egg Roast", price: 50 },
      ],
    },
    {
      id: 2,
      name: "Briyani",
      items: [
        { name: "Chicken Briyani", price: 120 },
        { name: "Mutton Briyani", price: 150 },
        { name: "Egg Briyani", price: 100 },
        { name: "Veg Briyani", price: 80 },
        { name: "Special Briyani", price: 180 },
      ],
    },
    {
      id: 3,
      name: "Parotta",
      items: [
        { name: "Plain Parotta", price: 15 },
        { name: "Egg Parotta", price: 30 },
        { name: "Chicken Parotta", price: 40 },
        { name: "Mutton Parotta", price: 50 },
        { name: "Cheese Parotta", price: 35 },
      ],
    },
    {
      id: 4,
      name: "Rice",
      items: [
        { name: "Plain Rice", price: 20 },
        { name: "Jeera Rice", price: 30 },
        { name: "Lemon Rice", price: 40 },
        { name: "Tomato Rice", price: 40 },
        { name: "Curd Rice", price: 30 },
      ],
    },
    {
      id: 5,
      name: "Noodles",
      items: [
        { name: "Veg Noodles", price: 60 },
        { name: "Chicken Noodles", price: 80 },
        { name: "Egg Noodles", price: 70 },
        { name: "Mushroom Noodles", price: 70 },
        { name: "Special Noodles", price: 100 },
      ],
    },
    {
      id: 6,
      name: "Egg",
      items: [
        { name: "Boiled Egg", price: 15 },
        { name: "Omelette", price: 25 },
        { name: "Egg Curry", price: 40 },
        { name: "Egg Biryani", price: 60 },
        { name: "Egg Fried Rice", price: 50 },
      ],
    },
    {
      id: 7,
      name: "Grill & Tandoori",
      items: [
        { name: "Chicken Tikka", price: 150 },
        { name: "Mutton Tikka", price: 180 },
        { name: "Fish Tikka", price: 200 },
        { name: "Paneer Tikka", price: 120 },
        { name: "Mixed Grill", price: 250 },
      ],
    },
    {
      id: 8,
      name: "Roti & Naan",
      items: [
        { name: "Plain Naan", price: 20 },
        { name: "Butter Naan", price: 30 },
        { name: "Garlic Naan", price: 35 },
        { name: "Cheese Naan", price: 40 },
        { name: "Tandoori Roti", price: 25 },
      ],
    },
  ];

  const getCurrentItems = () => {
    return categories.find(cat => cat.name === selectedCategory)?.items || [];
  };

  return (
    <div className="flex gap-4">
      <div className="w-48 flex flex-col gap-2">
        <div className="text-lg font-bold mb-2">Select a Category</div>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={`text-left px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === category.name
                ? "bg-[rgb(245,245,245)] text-black border-2 border-gray-300"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-sm">
              {category.id}
            </span>
            {category.name}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-3 gap-4">
          {getCurrentItems().map((item, index) => (
            <button
              key={index}
              onClick={() => onItemClick(item)}
              className="w-[166px] h-[166px] bg-white border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="font-bold text-center">{item.name}</div>
              <div className="text-center">₹{item.price}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuCategories; 