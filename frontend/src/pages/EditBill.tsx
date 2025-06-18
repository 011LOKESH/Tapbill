import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BillDetailsModal from '@/components/tapbill/BillDetailsModal'; // Import the modal component
import DateFilterModal from '@/components/tapbill/DateFilterModal'; // Import the date filter modal
import { BillItem, api, Customer, ShopDetails } from '@/services/api'; // Adjust the import based on your structure
import jsPDF from 'jspdf';

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const EditBill: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<any[]>([]); // Adjust type as needed
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null); // State to hold the selected bill for details
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false); // State for date filter modal
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [filteredBills, setFilteredBills] = useState<any[]>([]); // State for filtered bills
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set()); // State to track selected bills
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  const navigateToMenu = () => {
    navigate('/menu'); // Navigate back to the MenuPage
  };

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bill-items', {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }
        const data = await response.json();
        setBills(data);
        setFilteredBills(data); // Initialize filtered bills with all bills
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    fetchBills();
    api.getShopDetails().then(setShopDetails);
  }, []);

  const getTodayBills = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      billDate.setHours(0, 0, 0, 0);
      return billDate.getTime() === today.getTime();
    });
  };

  const handleViewDetails = (bill: BillItem) => {
    setSelectedBill(bill);
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBill(null); // Clear the selected bill
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Filter bills based on the search query
    const filtered = bills.filter(bill => 
      String(bill.billNo).includes(query) || 
      bill.total.toString().includes(query) ||
      new Date(bill.createdAt).toLocaleDateString().includes(query)
    );
    setFilteredBills(filtered);
  };

  const handleOpenDateFilter = () => {
    setIsDateFilterOpen(true);
  };

  const handleCloseDateFilter = () => {
    setIsDateFilterOpen(false);
  };

  const handleDateFilter = (startDate: Date, endDate: Date) => {
    const filtered = bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startDate && billDate <= endDate;
    });
    setFilteredBills(filtered);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredBills.map(bill => bill._id));
      setSelectedBills(allIds);
    } else {
      setSelectedBills(new Set());
    }
  };

  const handleSelectBill = (id: string) => {
    const newSelectedBills = new Set(selectedBills);
    if (newSelectedBills.has(id)) {
      newSelectedBills.delete(id);
    } else {
      newSelectedBills.add(id);
    }
    setSelectedBills(newSelectedBills);
  };

  const handlePrintSelected = () => {
    // Print all selected bills
    filteredBills.forEach((bill) => {
      if (selectedBills.has(bill._id)) {
        handlePrintBill(bill);
      }
    });
  };

  const handleDeleteSelected = async () => {
    // Logic to delete selected bills
    const deletePromises = Array.from(selectedBills).map(async (id) => {
      try {
        const response = await fetch(`http://localhost:5000/api/bill-items/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const errorMessage = await response.text(); // Get error message from response
          throw new Error(`Failed to delete bill: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    });

    await Promise.all(deletePromises); // Wait for all delete requests to complete

    // Update the bills state
    const remainingBills = bills.filter(bill => !selectedBills.has(bill._id));
    setBills(remainingBills); // Update the bills state
    setFilteredBills(remainingBills); // Update the filtered bills state
    setSelectedBills(new Set()); // Clear selected bills
    console.log("Deleted selected bills:", Array.from(selectedBills));
  };

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handlePrintBill = (bill: any) => {
    const doc = new jsPDF({ unit: 'pt', format: [300, 600] });
    let y = 30;
    const lineGap = 18;
    const addSpace = (space = 8) => { y += space; };
    const dottedLine = () => {
      doc.setLineDashPattern([2, 2], 0);
      doc.line(20, y, 280, y);
      addSpace(8);
      doc.setLineDashPattern([], 0);
      addSpace(6);
    };
    // Shop details
    doc.setFontSize(14);
    doc.text(shopDetails?.shopName || 'SHOP NAME', 150, y, { align: 'center' });
    addSpace(lineGap);
    doc.setFontSize(10);
    doc.text(shopDetails?.shopAddress || 'Shop Address', 150, y, { align: 'center' });
    addSpace(lineGap);
    dottedLine();
    // Customer details (not available in bill, so show dash)
    doc.setFontSize(10);
    doc.text(`Customer: -`, 30, y);
    doc.text(`Phone: -`, 170, y);
    addSpace(lineGap);
    dottedLine();
    // Bill info
    doc.text(`Bill No: ${bill.billNo || '-'}`, 30, y);
    doc.text(`Date: ${formatDateTime(bill.createdAt)}`, 170, y);
    addSpace(lineGap);
    dottedLine();
    // Table header
    doc.setFont(undefined, 'bold');
    doc.text('S.No', 30, y);
    doc.text('Item', 65, y);
    doc.text('Qty', 160, y);
    doc.text('Price', 200, y);
    doc.text('Amt', 245, y);
    doc.setFont(undefined, 'normal');
    addSpace(lineGap - 2);
    dottedLine();
    // Table rows
    bill.items.forEach((item: any, idx: number) => {
      doc.text(`${idx + 1}`, 30, y);
      doc.text(item.name, 65, y, { maxWidth: 90 });
      doc.text(`${item.quantity}`, 160, y);
      doc.text(`${item.price.toFixed(2)}`, 200, y);
      doc.text(`${(item.price * item.quantity).toFixed(2)}`, 245, y);
      addSpace(lineGap - 2);
    });
    dottedLine();
    // Totals
    const totalQty = bill.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Qty: ${totalQty}`, 30, y);
    doc.text(`Total: ₹${bill.total.toFixed(2)}`, 170, y); // No superscript or formatting
    doc.setFont(undefined, 'normal');
    addSpace(lineGap);
    dottedLine();
    // Footer
    doc.setFontSize(11);
    doc.text('Thank You, Visit again.', 150, y + 10, { align: 'center' });
    // Only download PDF (no print, no new tab)
    doc.save(`Bill_${bill.billNo || 'NA'}.pdf`);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg">☰</button> {/* Hamburger button */}
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Edit Bill
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
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
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/5 bg-gray-100 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Today's Bills</h2>
          <ul className="space-y-2">
            {getTodayBills().map((bill) => (
              <li key={bill._id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">Bill #{bill.billNo}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(bill.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{bill.total.toFixed(2)}</div>
                    <button 
                      onClick={() => handleViewDetails(bill)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center mb-4">
            <div className="relative w-1/2">
              <input
                type="text"
                placeholder="Search by Bill ID, Amount, or Date"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-gray-200 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] border-solid focus:outline-none focus:ring-2 focus:ring-[rgb(56,224,120)] focus:border-transparent text-sm"
              />
              <button 
                onClick={handleOpenDateFilter} 
                className="absolute right-0 top-0 h-10 px-4 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"></path>
                </svg>
              </button>
            </div>
            <div className="flex ml-4 justify-end flex-1"> {/* Moved buttons to the right */}
              <button 
                onClick={handlePrintSelected} 
                className="bg-[rgb(56,224,120)] text-white h-10 px-6 rounded-lg mr-2"
              >
                Print
              </button>
              <button 
                onClick={handleDeleteSelected} 
                className="bg-[#F5F5F5] text-black h-10 px-6 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedBills.size === filteredBills.length && filteredBills.length > 0}
                      className="mx-auto"
                    />
                  </th>
                  <th className="px-4 py-2 text-center">Sr. No</th>
                  <th className="px-4 py-2 text-center">Bill No</th>
                  <th className="px-4 py-2 text-center">Date & Time</th>
                  <th className="px-4 py-2 text-center">Payment Mode</th>
                  <th className="px-4 py-2 text-center">Tax</th>
                  <th className="px-4 py-2 text-center">Total</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.map((bill, index) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill._id)}
                        onChange={() => handleSelectBill(bill._id)}
                        className="mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">{index + 1}</td>
                    <td className="px-4 py-2 text-center">#{bill.billNo}</td>
                    <td className="px-4 py-2 text-center">
                      {new Date(bill.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">Cash</td>
                    <td className="px-4 py-2 text-center">
                      ₹{(bill.total * 0.1).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      ₹{bill.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleViewDetails(bill)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handlePrintBill(bill)}
                        className="inline-flex items-center justify-center bg-gray-100 hover:bg-[rgb(56,224,120)] text-gray-700 hover:text-white rounded-full p-2 transition-colors"
                        title="Print"
                        aria-label="Print Bill"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4a1 1 0 011-1h10a1 1 0 011 1v5M6 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-1m-10 0v2a1 1 0 001 1h6a1 1 0 001-1v-2m-8 0h8" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BillDetailsModal isOpen={isModalOpen} onClose={closeModal} bill={selectedBill} />
      <DateFilterModal isOpen={isDateFilterOpen} onClose={handleCloseDateFilter} onFilter={handleDateFilter} />
    </div>
  );
};

export default EditBill; 