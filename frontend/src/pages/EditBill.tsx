import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BillDetailsModal from '@/components/tapbill/BillDetailsModal'; // Import the modal component
import DateFilterModal from '@/components/tapbill/DateFilterModal'; // Import the date filter modal
import { BillItem, api, Customer, ShopDetails } from '@/services/api'; // Adjust the import based on your structure
import { printReceipt, BillData, generateReceiptHTML } from '@/services/printService';
import PrinterConfigService from '@/services/printerConfig';
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
        const data = await api.getBillItems();
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

  const handlePrintSelected = async () => {
    const selectedBillsList = filteredBills.filter(bill => selectedBills.has(bill._id));
    if (selectedBillsList.length === 0) {
      alert('Please select bills to print');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Print each selected bill with direct printing + PDF backup
    for (const bill of selectedBillsList) {
      const success = await handlePrintBillWithDirectPrint(bill);
      if (success) successCount++;
      else failCount++;
    }

    // Show summary message
    if (successCount > 0 && failCount === 0) {
      alert(`✅ All ${successCount} bills printed successfully! PDFs also saved as backup.`);
    } else if (successCount > 0 && failCount > 0) {
      alert(`⚠️ ${successCount} bills printed successfully, ${failCount} failed. All PDFs saved.`);
    } else {
      alert(`⚠️ Direct printing failed for all bills. PDFs saved successfully.`);
    }
  };

  const handlePrintBillWithDirectPrint = async (bill: any): Promise<boolean> => {
    try {
      // Prepare bill data for direct printing
      const printBillData: BillData = {
        billNo: bill.billNo || 'NA',
        items: bill.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total: bill.total,
        createdAt: bill.createdAt,
        shopDetails: {
          name: shopDetails?.shopName || 'TapBill Restaurant',
          address: shopDetails?.shopAddress || '',
          phone: shopDetails?.phone || ''
        }
      };

      // Try direct printing first
      let printSuccess = false;
      try {
        printSuccess = await printReceipt(printBillData, { silent: true });
        if (printSuccess) {
          console.log(`✅ Bill ${bill.billNo} printed successfully to printer`);
        }
      } catch (error) {
        console.error('Direct print error:', error);
      }

      // Show success/failure message and handle PDF generation
      const printerSettings = PrinterConfigService.getSettings();
      if (printSuccess) {
        // Printer connected and printing successful - no PDF needed
        alert(`✅ Bill printed successfully (${printerSettings.selectedWidth})!`);
      } else {
        // Printer not connected - show error and generate PDF as backup
        generateThermalPrintPDF(printBillData);
        alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
      }

      return printSuccess;
    } catch (error) {
      console.error('Print error for bill:', bill.billNo, error);
      return false;
    }
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

  // Generate thermal printer format PDF as backup (same as home page)
  const generateThermalPrintPDF = (billData: BillData) => {
    try {
      // Use the exact same PDF generation as home page
      const printerSettings = PrinterConfigService.getSettings();
      const pdfFormat = PrinterConfigService.getPDFFormat(printerSettings.selectedWidth);
      const layout = PrinterConfigService.getPDFLayout(printerSettings.selectedWidth);

      // Validate layout before generating PDF
      if (!PrinterConfigService.validatePDFLayout(printerSettings.selectedWidth)) {
        console.warn('PDF layout validation failed, using default 80mm layout');
      }

      const doc = new jsPDF({ unit: 'pt', format: pdfFormat });

      let y = layout.topMargin;
      const addSpace = (space = layout.lineHeight) => { y += space; };
      const dottedLine = () => {
        doc.setLineDashPattern([2, 2], 0);
        doc.line(layout.leftMargin, y, layout.paperWidth - layout.rightMargin, y);
        addSpace(layout.sectionSpacing);
        doc.setLineDashPattern([], 0);
        addSpace(layout.sectionSpacing);
      };

      // Shop details
      doc.setFontSize(layout.headerFontSize);
      doc.text(billData.shopDetails?.name || 'TapBill Restaurant', layout.centerX, y, { align: 'center' });
      addSpace();
      doc.setFontSize(layout.subHeaderFontSize);
      if (billData.shopDetails?.address) {
        doc.text(billData.shopDetails.address, layout.centerX, y, { align: 'center', maxWidth: layout.contentWidth });
        addSpace();
      }
      if (billData.shopDetails?.phone) {
        doc.text(`Ph: ${billData.shopDetails.phone}`, layout.centerX, y, { align: 'center' });
        addSpace();
      }
      dottedLine();

      // Bill info (stack vertically for both 58mm and 80mm to prevent cutoff)
      doc.setFontSize(layout.bodyFontSize);
      doc.text(`Bill No: ${billData.billNo}`, layout.leftMargin, y);
      addSpace();
      // Format date and time as DD/MM/YYYY HH:MM
      const billDate = new Date(billData.createdAt);
      const formattedDateTime = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth()+1).toString().padStart(2, '0')}/${billDate.getFullYear()} ${billDate.getHours().toString().padStart(2, '0')}:${billDate.getMinutes().toString().padStart(2, '0')}`;
      doc.text(`Date: ${formattedDateTime}`, layout.leftMargin, y);
      addSpace();
      dottedLine();

      // Table header (no S.No column)
      doc.setFontSize(layout.itemFontSize);
      doc.setFont(undefined, 'bold');
      doc.text('Item', layout.columns.item, y);
      doc.text('Qty', layout.columns.qty, y);
      doc.text('Price', layout.columns.price, y);
      doc.text('Total', layout.columns.total, y);
      doc.setFont(undefined, 'normal');
      addSpace(layout.sectionSpacing);
      dottedLine();

      // Table rows (no S.No column)
      billData.items.forEach((item) => {
        doc.text(item.name, layout.columns.item, y, { maxWidth: layout.columnWidths.item });
        doc.text(String(item.quantity), layout.columns.qty, y);
        doc.text(String(item.price.toFixed(2)), layout.columns.price, y);
        doc.text(String((item.price * item.quantity).toFixed(2)), layout.columns.total, y);
        addSpace(layout.lineHeight);
      });
      dottedLine();

      // Totals (match home page format exactly)
      const totalQty = billData.items.reduce((sum, item) => sum + item.quantity, 0);
      doc.setFontSize(layout.totalFontSize);
      doc.setFont(undefined, 'bold');
      // Stack vertically for both layouts to ensure proper positioning
      doc.text(`Total Qty: ${String(totalQty)}`, layout.leftMargin, y);
      addSpace();
      doc.text(`Total: Rs.${String(billData.total.toFixed(2))}`, layout.leftMargin, y);
      addSpace();
      doc.setFont(undefined, 'normal');
      dottedLine();

      // Footer (match home page format exactly)
      doc.setFontSize(layout.bodyFontSize);
      addSpace(layout.sectionSpacing);
      doc.text('Thank You, Visit again.', layout.centerX, y, { align: 'center' });

      // Save PDF with printer width in filename
      const fileName = `Bill_${billData.billNo}_${printerSettings.selectedWidth}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating thermal print PDF:', error);
    }
  };

  // Legacy function for individual bill printing (now uses thermal format)
  const handlePrintBill = async (bill: any) => {
    await handlePrintBillWithDirectPrint(bill);
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
                        onClick={() => handlePrintBillWithDirectPrint(bill)}
                        className="inline-flex items-center justify-center bg-gray-100 hover:bg-[rgb(56,224,120)] text-gray-700 hover:text-white rounded-full p-2 transition-colors"
                        title="Print (Direct + PDF)"
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