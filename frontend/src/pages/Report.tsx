import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { api, ShopDetails } from '@/services/api';

interface SaleData {
  id: number;
  date: string;
  numberOfBills: number;
  tax: number;
  totalSale: number;
}

interface BillData {
  _id: string;
  billNo: string;
  createdAt: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  useEffect(() => {
    api.getShopDetails().then(setShopDetails);
  }, []);

  const navigateToMenu = () => {
    navigate('/menu');
  };

  const handleCategoryClick = (category: string) => {
    switch (category) {
      case 'day-summary':
        navigate('/day-wise-sales');
        break;
      case 'bill-sales':
        navigate('/bill-wise-sales');
        break;
      case 'deleted-items':
        navigate('/deleted-items');
        break;
      case 'deleted-bill':
        navigate('/deleted-bills');
        break;
      case 'day-sales':
        printDaySalesReceipt('DaySales.pdf');
        break;
      case 'bill-sales-print':
        printBillSalesReceipt('BillSales.pdf');
        break;
      case 'user-report':
        navigate('/user-details');
        break;
      default:
        console.log(`Clicked on ${category}`);
    }
  };

  const fetchDailySales = async (): Promise<SaleData[]> => {
    try {
      // Fetch all bills from the database
      const response = await fetch('http://localhost:5000/api/bill-items', {
        headers: getAuthHeaders(),
      });
      const bills: Array<{ _id: string; createdAt: string; total: number }> = await response.json();

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Filter bills for today only
      const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
        return billDate === today;
      });

      // Calculate today's totals
      const todayTotals: SaleData = {
        id: Date.now(),
        date: today,
        numberOfBills: todayBills.length,
        tax: todayBills.reduce((sum, bill) => sum + (bill.total * 0.1), 0),
        totalSale: todayBills.reduce((sum, bill) => sum + bill.total, 0)
      };

      return [todayTotals];
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      return [];
    }
  };

  const printDaySalesReceipt = async (fileName = 'DaySales.pdf') => {
    try {
      const salesData = await fetchDailySales();
      if (salesData.length === 0) {
        alert('No sales data available');
        return;
      }

      const doc = new jsPDF({ unit: 'pt', format: [300, 600 + salesData.length * 20] });
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
      
      // Table header
      doc.setFont(undefined, 'bold');
      doc.text('S.No', 30, y);
      doc.text('Date', 65, y);
      doc.text('No of Bills', 130, y);
      doc.text('Tax', 200, y);
      doc.text('Total Sales', 245, y);
      doc.setFont(undefined, 'normal');
      addSpace(lineGap - 2);
      dottedLine();
      
      // Table rows
      salesData.forEach((sale, idx) => {
        doc.text(`${idx + 1}`, 30, y);
        doc.text(sale.date, 65, y);
        doc.text(`${sale.numberOfBills}`, 130, y);
        doc.text(`${sale.tax.toFixed(2)}`, 200, y);
        doc.text(`${sale.totalSale.toFixed(2)}`, 245, y);
        addSpace(lineGap + 5); // Increased spacing for better readability
      });
      dottedLine();
      
      // Footer
      doc.setFontSize(11);
      doc.text('Thank You, Visit again.', 150, y + 10, { align: 'center' });
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const fetchTodayBills = async (): Promise<BillData[]> => {
    try {
      // Fetch all bills from the database
      const response = await fetch('http://localhost:5000/api/bill-items', {
        headers: getAuthHeaders(),
      });
      const bills: BillData[] = await response.json();

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Filter bills for today only
      const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
        return billDate === today;
      });

      return todayBills;
    } catch (error) {
      console.error('Error fetching today\'s bills:', error);
      return [];
    }
  };

  const printBillSalesReceipt = async (fileName = 'BillSales.pdf') => {
    try {
      const bills = await fetchTodayBills();
      if (bills.length === 0) {
        alert('No bills available for today');
        return;
      }

      const doc = new jsPDF({ unit: 'pt', format: [300, 600 + bills.length * 25] });
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
      
      // Table header
      doc.setFont(undefined, 'bold');
      doc.text('S.No', 30, y);
      doc.text('Bill No', 65, y);
      doc.text('Time', 120, y);
      doc.text('Items', 180, y);
      doc.text('Total', 245, y);
      doc.setFont(undefined, 'normal');
      addSpace(lineGap - 2);
      dottedLine();
      
      // Table rows
      bills.forEach((bill, idx) => {
        const time = new Date(bill.createdAt).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const itemCount = bill.items.length;
        
        doc.text(`${idx + 1}`, 30, y);
        doc.text(String(bill.billNo), 65, y);
        doc.text(time, 120, y);
        doc.text(`${itemCount}`, 180, y);
        doc.text(`${bill.total.toFixed(2)}`, 245, y);
        addSpace(lineGap + 5);
      });
      dottedLine();
      
      // Footer
      doc.setFontSize(11);
      doc.text('Thank You, Visit again.', 150, y + 10, { align: 'center' });
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg">☰</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Report
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Categories</h1>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Daily Update Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">Daily Update</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('day-summary')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Day Summary</h3>
                  <p className="text-sm text-gray-600">A brief breakdown of daily transactions.</p>
                </div>
                <div onClick={() => handleCategoryClick('bill-sales')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Bill Sales</h3>
                  <p className="text-sm text-gray-600">Analyze bill trends and patterns.</p>
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">Product Details</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('deleted-items')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Deleted Items</h3>
                  <p className="text-sm text-gray-600">Overview of removed products from the inventory.</p>
                </div>
                <div onClick={() => handleCategoryClick('deleted-bill')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Deleted Bill</h3>
                  <p className="text-sm text-gray-600">Details of bills that have been deleted.</p>
                </div>
              </div>
            </div>

            {/* Print Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">Print</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('day-sales')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Day Sales</h3>
                  <p className="text-sm text-gray-600">Summary of total sales and transactions completed during the day.</p>
                </div>
                <div onClick={() => handleCategoryClick('bill-sales-print')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Bill Sales</h3>
                  <p className="text-sm text-gray-600">Overview of individual bills with details of amounts and payment modes.</p>
                </div>
              </div>
            </div>

            {/* User Details Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">User Details</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('user-report')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">User Report</h3>
                  <p className="text-sm text-gray-600">Analytics on user behavior and engagement.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report; 