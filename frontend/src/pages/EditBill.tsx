import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BillItem } from '@/services/api'; // Adjust the import based on your structure

const EditBill: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<{ _id: string; items: { name: string; price: number }[]; total: number }[]>([]); // Updated type
  const [lastBill, setLastBill] = useState<BillItem | null>(null);

  const navigateToMenu = () => {
    navigate('/menu'); // Navigate back to the MenuPage
  };

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch('/api/bill-items'); // Ensure this matches your backend route
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setBills(data); // Assuming data is an array of bill objects
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    const fetchLastBill = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/last-bill');
        if (!response.ok) {
          throw new Error('Failed to fetch last bill');
        }
        const data = await response.json();
        setLastBill(data);
      } catch (error) {
        console.error('Error fetching last bill:', error);
      }
    };

    fetchLastBill();
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg">☰</button> {/* Hamburger button */}
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Edit Bill
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgba(56,224,120,1)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {new Date().toLocaleString()} {/* Display current date and time */}
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-full">
        <div className="w-1/4 bg-gray-100 p-4">
          <h2 className="text-lg font-bold">Today's</h2>
          <ul className="mt-4">
            {bills.map((bill) => (
              <li key={bill._id} className="flex justify-between items-center py-2">
                <span>{bill.items.map(item => item.name).join(', ')}</span> {/* Display item names */}
                <span>₹{bill.total.toFixed(2)}</span>
                <span className="text-green-500">✔️</span> {/* Symbol on the right */}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 p-4 bg-transparent">
          <h2 className="text-xl font-bold">Edit Your Bill</h2>
          {/* Additional form or content for editing the bill can go here */}
          {lastBill && (
            <div>
              <h2>Last Bill Details</h2>
              <ul>
                {lastBill.items.map(item => (
                  <li key={item._id}>
                    {item.name} - Quantity: {item.quantity} - Total: ₹{item.total}
                  </li>
                ))}
              </ul>
              <h3>Total Amount: ₹{lastBill.total}</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditBill; 