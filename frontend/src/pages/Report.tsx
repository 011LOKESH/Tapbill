import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { api, ShopDetails } from '@/services/api';
import { printReport, ReportData } from '@/services/printService';
import PrinterConfigService from '@/services/printerConfig';

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
        printDaySalesReceiptWithDirectPrint('DaySales.pdf');
        break;
      case 'bill-sales-print':
        printBillSalesReceiptWithDirectPrint('BillSales.pdf');
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

  const printDaySalesReceiptWithDirectPrint = async (fileName = 'DaySales.pdf') => {
    try {
      const salesData = await fetchDailySales();
      if (salesData.length === 0) {
        alert('No sales data available');
        return;
      }

      // Prepare report data for direct printing
      const reportData: ReportData = {
        title: 'Day Sales Summary',
        date: new Date().toLocaleDateString(),
        items: salesData.map(sale => ({
          'Date': sale.date || 'N/A',
          'Bills': sale.numberOfBills || 0,
          'Tax': `₹${(sale.tax || 0).toFixed(2)}`,
          'Amount': `₹${(sale.totalSale || 0).toFixed(2)}`
        })),
        totals: {
          'Total Days': salesData.length,
          'Total Bills': salesData.reduce((sum, sale) => sum + (sale.numberOfBills || 0), 0),
          'Total Amount': `₹${salesData.reduce((sum, sale) => sum + (sale.totalSale || 0), 0).toFixed(2)}`
        }
      };

      // Try direct printing first
      let printSuccess = false;
      try {
        printSuccess = await printReport(reportData, { silent: true });
        if (printSuccess) {
          console.log('✅ Day sales report printed successfully');
        }
      } catch (error) {
        console.error('Direct print error:', error);
      }

      // Always generate PDF as backup
      printDaySalesReceipt(fileName);

      // Show result message
      if (printSuccess) {
        alert('✅ Day sales report printed successfully! PDF also saved as backup.');
      } else {
        alert('⚠️ Direct printing failed. PDF saved successfully.');
      }
    } catch (error) {
      console.error('Error in day sales print:', error);
      alert('Error generating day sales report');
    }
  };

  const printDaySalesReceipt = async (fileName = 'DaySales.pdf') => {
    try {
      const salesData = await fetchDailySales();
      if (salesData.length === 0) {
        alert('No sales data available');
        return;
      }

      // Use thermal printer format (same as home page)
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
      doc.text(shopDetails?.shopName || 'TapBill Restaurant', layout.centerX, y, { align: 'center' });
      addSpace();
      doc.setFontSize(layout.subHeaderFontSize);
      if (shopDetails?.shopAddress) {
        doc.text(shopDetails.shopAddress, layout.centerX, y, { align: 'center', maxWidth: layout.contentWidth });
        addSpace();
      }
      if (shopDetails?.phone) {
        doc.text(`Ph: ${shopDetails.phone}`, layout.centerX, y, { align: 'center' });
        addSpace();
      }
      dottedLine();

      // Title
      doc.setFontSize(layout.bodyFontSize);
      doc.text('Day Sales Report', layout.centerX, y, { align: 'center' });
      addSpace();
      // Format current date and time as DD/MM/YYYY HH:MM
      const currentDate = new Date();
      const formattedDateTime = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth()+1).toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
      doc.text(formattedDateTime, layout.centerX, y, { align: 'center' });
      addSpace();
      dottedLine();

      // Table headers (no S.No column)
      doc.setFontSize(layout.itemFontSize);
      doc.text('Date', layout.columns.item, y);
      doc.text('Bills', layout.columns.qty, y);
      doc.text('Tax', layout.columns.price, y);
      doc.text('Total', layout.columns.total, y);
      addSpace();
      dottedLine();

      // Table rows (no S.No column)
      salesData.forEach((sale) => {
        // Format date as DD/MM/YYYY
        const saleDate = new Date(sale.date);
        const formattedDate = `${saleDate.getDate().toString().padStart(2, '0')}/${(saleDate.getMonth()+1).toString().padStart(2, '0')}/${saleDate.getFullYear()}`;
        doc.text(formattedDate, layout.columns.item, y, { maxWidth: layout.columnWidths.item });
        doc.text(String(sale.numberOfBills), layout.columns.qty, y);
        doc.text(String(sale.tax.toFixed(0)), layout.columns.price, y);
        doc.text(String(sale.totalSale.toFixed(0)), layout.columns.total, y);
        addSpace();
      });
      dottedLine();

      // Footer
      doc.setFontSize(layout.bodyFontSize);
      addSpace(layout.sectionSpacing);
      doc.text('Thank You, Visit again.', layout.centerX, y, { align: 'center' });

      // Save PDF with printer width in filename
      const thermalFileName = fileName.replace('.pdf', `_${printerSettings.selectedWidth}.pdf`);
      doc.save(thermalFileName);
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

  const printBillSalesReceiptWithDirectPrint = async (fileName = 'BillSales.pdf') => {
    try {
      const bills = await fetchTodayBills();
      if (bills.length === 0) {
        alert('No bills available for today');
        return;
      }

      // Prepare report data for direct printing
      const reportData: ReportData = {
        title: 'Bill Sales Summary',
        date: new Date().toLocaleDateString(),
        items: bills.map(bill => ({
          'Bill#': bill.billNo,
          'Date': new Date(bill.createdAt).toLocaleDateString(),
          'Items': bill.items.length,
          'Qty': bill.items.reduce((sum, item) => sum + item.quantity, 0),
          'Amount': `₹${bill.total.toFixed(2)}`
        })),
        totals: {
          'Total Bills': bills.length,
          'Total Quantity': bills.reduce((sum, bill) => sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
          'Total Amount': `₹${bills.reduce((sum, bill) => sum + bill.total, 0).toFixed(2)}`
        }
      };

      // Try direct printing first
      let printSuccess = false;
      try {
        printSuccess = await printReport(reportData, { silent: true });
        if (printSuccess) {
          console.log('✅ Bill sales report printed successfully');
        }
      } catch (error) {
        console.error('Direct print error:', error);
      }

      // Always generate PDF as backup
      printBillSalesReceipt(fileName);

      // Show result message
      if (printSuccess) {
        alert('✅ Bill sales report printed successfully! PDF also saved as backup.');
      } else {
        alert('⚠️ Direct printing failed. PDF saved successfully.');
      }
    } catch (error) {
      console.error('Error in bill sales print:', error);
      alert('Error generating bill sales report');
    }
  };

  const printBillSalesReceipt = async (fileName = 'BillSales.pdf') => {
    try {
      const bills = await fetchTodayBills();
      if (bills.length === 0) {
        alert('No bills available for today');
        return;
      }

      // Use thermal printer format (same as home page)
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
      doc.text(shopDetails?.shopName || 'TapBill Restaurant', layout.centerX, y, { align: 'center' });
      addSpace();
      doc.setFontSize(layout.subHeaderFontSize);
      if (shopDetails?.shopAddress) {
        doc.text(shopDetails.shopAddress, layout.centerX, y, { align: 'center', maxWidth: layout.contentWidth });
        addSpace();
      }
      if (shopDetails?.phone) {
        doc.text(`Ph: ${shopDetails.phone}`, layout.centerX, y, { align: 'center' });
        addSpace();
      }
      dottedLine();

      // Title
      doc.setFontSize(layout.bodyFontSize);
      doc.text('Bill Sales Report', layout.centerX, y, { align: 'center' });
      addSpace();
      // Format current date and time as DD/MM/YYYY HH:MM
      const currentDate = new Date();
      const formattedDateTime = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth()+1).toString().padStart(2, '0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
      doc.text(formattedDateTime, layout.centerX, y, { align: 'center' });
      addSpace();
      dottedLine();

      // Table headers (no S.No column) - optimized column spacing
      doc.setFontSize(layout.itemFontSize);

      // Optimized column positions for better space utilization (same as BillWiseSales.tsx)
      const optimizedColumns = {
        billNo: layout.columns.item,                    // Bill# column (original position)
        dateTime: layout.columns.item + 35,             // Date/Time column (reduced gap from qty column)
        items: layout.columns.price - 10,               // Items column (moved left slightly)
        total: layout.columns.total                      // Total column (original position)
      };

      doc.text('Bill#', optimizedColumns.billNo, y);
      doc.text('Date/Time', optimizedColumns.dateTime, y);
      doc.text('Items', optimizedColumns.items, y);
      doc.text('Total', optimizedColumns.total, y);
      addSpace();
      dottedLine();

      // Table rows (no S.No column) - optimized column spacing
      bills.forEach((bill) => {
        // Format date and time as DD/MM/YYYY HH:MM
        const billDate = new Date(bill.createdAt);
        const formattedDateTime = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth()+1).toString().padStart(2, '0')}/${billDate.getFullYear()} ${billDate.getHours().toString().padStart(2, '0')}:${billDate.getMinutes().toString().padStart(2, '0')}`;
        const itemCount = bill.items.length;

        // Use shorter bill number to prevent overlap
        const shortBillNo = String(bill.billNo).substring(0, 6);

        // Optimized column positions for better space utilization (same as BillWiseSales.tsx)
        const optimizedColumns = {
          billNo: layout.columns.item,                    // Bill# column (original position)
          dateTime: layout.columns.item + 35,             // Date/Time column (reduced gap from qty column)
          items: layout.columns.price - 10,               // Items column (moved left slightly)
          total: layout.columns.total                      // Total column (original position)
        };

        doc.text(shortBillNo, optimizedColumns.billNo, y, { maxWidth: 30 });

        // Use compact single-line format for date/time
        const compactDateTime = `${formattedDateTime.substring(0, 10)} ${formattedDateTime.substring(11, 16)}`; // DD/MM/YYYY HH:MM
        doc.text(compactDateTime, optimizedColumns.dateTime, y, { maxWidth: 45 });

        doc.text(String(itemCount), optimizedColumns.items, y);
        doc.text(String(bill.total.toFixed(0)), optimizedColumns.total, y);

        // Add extra spacing between rows to prevent collision
        addSpace(layout.lineHeight * 1.5);
      });
      dottedLine();

      // Footer
      doc.setFontSize(layout.bodyFontSize);
      addSpace(layout.sectionSpacing);
      doc.text('Thank You, Visit again.', layout.centerX, y, { align: 'center' });

      // Save PDF with printer width in filename
      const thermalFileName = fileName.replace('.pdf', `_${printerSettings.selectedWidth}.pdf`);
      doc.save(thermalFileName);
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