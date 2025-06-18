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

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const DaySummary: React.FC = () => {
  const navigate = useNavigate();
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  useEffect(() => {
    api.getShopDetails().then(setShopDetails);
  }, []);

  const navigateToMenu = () => {
    navigate('/menu');
  };

  const fetchDailySales = async (): Promise<SaleData[]> => {
    try {
      // Fetch all bills from the database
      const response = await fetch('http://localhost:5000/api/bill-items', {
        headers: getAuthHeaders(),
      });
      const bills: Array<{ _id: string; createdAt: string; total: number }> = await response.json();

      // Group bills by date and calculate daily totals
      const dailyTotals = bills.reduce((acc: { [key: string]: SaleData }, bill) => {
        const date = new Date(bill.createdAt).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            id: Date.now() + Math.random(),
            date: date,
            numberOfBills: 0,
            tax: 0,
            totalSale: 0
          };
        }

        acc[date].numberOfBills += 1;
        acc[date].tax += bill.total * 0.1;
        acc[date].totalSale += bill.total;

        return acc;
      }, {});

      // Convert to array and sort by date descending
      const salesData: SaleData[] = Object.values(dailyTotals).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return salesData;
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      return [];
    }
  };

  const printDaySummaryReceipt = async (fileName = 'DaySummary.pdf') => {
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg">←</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Day Summary
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
      <div className="flex-1 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-center">Day Summary Report</h1>
            <p className="text-gray-600 mb-8 text-center">
              Generate a comprehensive daily sales summary with all transactions, taxes, and totals.
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={() => printDaySummaryReceipt('DaySummary.pdf')}
                className="bg-[rgb(56,224,120)] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[rgb(46,204,110)] transition-colors"
              >
                Download Day Summary PDF
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">What's included in the report:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Shop name and address</li>
                <li>• Daily sales summary with S.No, Date, No of Bills, Tax, and Total Sales</li>
                <li>• All dates with transaction data</li>
                <li>• Professional receipt format</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaySummary; 