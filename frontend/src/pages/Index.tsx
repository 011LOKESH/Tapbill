import React, { useState, useEffect } from "react";
import Header from "@/components/tapbill/Header";
import CustomerSection from "@/components/tapbill/CustomerSection";
import BillDisplay from "@/components/tapbill/BillDisplay";
import MenuSection from "@/components/tapbill/MenuSection";
import { api, BillItem } from "@/services/api";

const Index = () => {
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  useEffect(() => {
    loadBillItems();
  }, []);

  const loadBillItems = async () => {
    try {
      const items = await api.getBillItems();
      setBillItems(items);
    } catch (error) {
      console.error("Error loading bill items:", error);
    }
  };

  const handleItemClick = async (name: string, price: number) => {
    try {
      const updatedItem = await api.addBillItem(name, price);
      setBillItems(prevItems => {
        const existingItem = prevItems.find(item => item._id === updatedItem._id);
        if (existingItem) {
          return prevItems.map(item =>
            item._id === updatedItem._id ? updatedItem : item
          );
        }
        return [...prevItems, updatedItem];
      });
    } catch (error) {
      console.error("Error adding bill item:", error);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    try {
      const updatedItem = await api.updateBillItemQuantity(id, quantity);
      setBillItems(prevItems =>
        prevItems.map(item =>
          item._id === id ? updatedItem : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.deleteBillItem(id);
      setBillItems(prevItems => prevItems.filter(item => item._id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleClearBill = async () => {
    try {
      await api.clearBill();
      setBillItems([]);
    } catch (error) {
      console.error("Error clearing bill:", error);
    }
  };

  return (
    <div className="bg-white flex flex-col overflow-hidden items-stretch">
      <div className="bg-white w-full max-md:max-w-full">
        <div className="bg-white min-h-[1024px] w-full overflow-hidden max-md:max-w-full">
          <div className="w-full max-md:max-w-full">
            <Header />
          </div>

          <main className="container mx-auto px-4">
            <div className="flex flex-col gap-4 mt-4">
              <CustomerSection />
              <MenuSection onItemClick={handleItemClick} />
            </div>
          </main>
        </div>
      </div>

      <BillDisplay 
        items={billItems} 
        onUpdateQuantity={handleUpdateQuantity}
        onDeleteItem={handleDeleteItem}
        onClearBill={handleClearBill}
      />
    </div>
  );
};

export default Index;
