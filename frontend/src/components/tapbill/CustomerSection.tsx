import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import MenuCategories from "./MenuCategories";
import PricingArea from "./PricingArea";

interface CustomerSectionProps {
  onSearch?: (query: string) => void;
}

interface BillItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Menu {
  id: string;
  name: string;
  items: BillItem[];
}

interface LastBillDetails {
  items: BillItem[];
  total: number;
  timestamp: Date;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showLastBillPopup, setShowLastBillPopup] = useState(false);
  const [lastBillDetails, setLastBillDetails] = useState<LastBillDetails | null>(null);

  // Initialize with Menu 1 on component mount
  useEffect(() => {
    const initialMenu: Menu = {
      id: Date.now().toString(),
      name: "Menu 1",
      items: []
    };
    setMenus([initialMenu]);
    setActiveMenuId(initialMenu.id);
  }, []);

  const handleAddCustomer = () => {
    navigate('/customer-details');
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value);
  };

  const handleItemClick = (item: { name: string; price: number }) => {
    if (!activeMenuId) return;
    
    setMenus(prevMenus =>
      prevMenus.map(menu =>
        menu.id === activeMenuId
          ? {
              ...menu,
              items: [
                ...menu.items.filter(i => i.name !== item.name),
                {
                  _id: Date.now().toString(),
                  name: item.name,
                  price: item.price,
                  quantity: (menu.items.find(i => i.name === item.name)?.quantity || 0) + 1
                }
              ]
            }
          : menu
      )
    );
  };

  const handleUpdateQuantity = (menuId: string, itemId: string, quantity: number) => {
    setMenus(prevMenus =>
      prevMenus.map(menu =>
        menu.id === menuId
          ? {
              ...menu,
              items: menu.items.map(item =>
                item._id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
              )
            }
          : menu
      )
    );
  };

  const handleDeleteItem = (menuId: string, itemId: string) => {
    setMenus(prevMenus =>
      prevMenus.map(menu =>
        menu.id === menuId
          ? {
              ...menu,
              items: menu.items.filter(item => item._id !== itemId)
            }
          : menu
      )
    );
  };

  const handleAddMenu = () => {
    const newMenu: Menu = {
      id: Date.now().toString(),
      name: `Menu ${menus.length + 1}`,
      items: []
    };
    setMenus(prev => [...prev, newMenu]);
    setActiveMenuId(newMenu.id);
  };

  const handleDeleteMenu = (menuId: string) => {
    // Don't allow deleting Menu 1
    if (menus.find(menu => menu.id === menuId)?.name === "Menu 1") return;
    
    setMenus(prev => prev.filter(menu => menu.id !== menuId));
    if (activeMenuId === menuId) {
      setActiveMenuId(menus.length > 1 ? menus[0].id : null);
    }
  };

  const handlePay = () => {
    if (activeMenu) {
      const total = activeMenu.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      setLastBillDetails({
        items: [...activeMenu.items],
        total,
        timestamp: new Date()
      });
      setShowLastBillPopup(true);
      // Clear the current menu items
      setMenus(prevMenus =>
        prevMenus.map(menu =>
          menu.id === activeMenu.id
            ? { ...menu, items: [] }
            : menu
        )
      );
    }
  };

  const activeMenu = menus.find(menu => menu.id === activeMenuId);
  const currentTotal = activeMenu?.items.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;

  return (
    <div className="flex w-full gap-4">
      <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <div className="w-[240px]">
          <input
            type="text"
            value={customerName}
            onChange={handleCustomerNameChange}
            placeholder="Customer Name"
            className="w-full bg-white border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] border-solid focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent text-sm"
          />
        </div>
        <div className="w-[240px]">
          <button
            onClick={handleAddCustomer}
            className="w-full bg-white border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] border-solid hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Add Customer +
          </button>
        </div>
      </div>
        <div className="w-[500px] relative">
          <input
            type="text"
            placeholder="Search by Code/Barcode/Name"
            className="w-full bg-gray-100 border h-10 pl-12 pr-4 rounded-xl border-[rgba(224,224,224,1)] border-solid focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[rgb(115,115,115)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {activeMenu && (
          <>
            <PricingArea 
              items={activeMenu.items} 
              onUpdateQuantity={(id, quantity) => handleUpdateQuantity(activeMenu.id, id, quantity)}
              onDeleteItem={(id) => handleDeleteItem(activeMenu.id, id)}
            />
            <div className="w-[500px] bg-[rgb(56,224,120)] rounded-2xl p-4 flex justify-between items-center relative">
              <div className="flex items-center gap-2">
                <span className="text-black font-bold text-lg">Last Bill</span>
                <button 
                  onClick={() => setShowLastBillPopup(true)}
                  className="p-1 hover:bg-black/10 rounded-full transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              <span className="text-black font-bold text-lg">
                ₹{lastBillDetails?.total.toFixed(2) || "0.00"}
              </span>
              {showLastBillPopup && lastBillDetails && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg p-4 z-50 w-80">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800">Last Bill Details</span>
                    <button 
                      onClick={() => setShowLastBillPopup(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-2">
                    {lastBillDetails.items.map((item) => (
                      <div key={item._id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">Total Amount</span>
                        <span className="font-bold text-lg">₹{lastBillDetails.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex overflow-x-auto">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer ${
                  activeMenuId === menu.id
                    ? 'border-[rgb(56,224,120)] text-[rgb(56,224,120)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveMenuId(menu.id)}
              >
                <span className="text-sm font-medium">{menu.name}</span>
                {menu.name !== "Menu 1" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMenu(menu.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex h-10 w-full items-center rounded-xl bg-white border border-[rgba(224,224,224,1)] hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleAddMenu}>
          <div className="flex h-full items-center justify-center px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-600">
            Add Menu
          </div>
        </div>
        <div className="flex justify-between gap-4">
          <button 
            onClick={handlePay}
            className="bg-[rgb(56,224,120)] text-black font-bold py-2 px-12 rounded-2xl hover:bg-[rgb(46,204,110)] transition-colors"
          >
            Pay
          </button>
          <button className="bg-[rgb(56,224,120)] text-black font-bold py-2 px-24 rounded-2xl hover:bg-[rgb(46,204,110)] transition-colors">
            Print Bill
          </button>
        </div>
        <MenuCategories onItemClick={handleItemClick} />
      </div>
    </div>
  );
};

export default CustomerSection;
