import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { api, ShopDetails } from '@/services/api';
import { printReport, ReportData, generateReportHTML } from '@/services/printService';
import PrinterConfigService from '@/services/printerConfig';

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

      // Prepare report data for direct printing
      const reportData: ReportData = {
        title: 'Day Summary Report',
        date: new Date().toLocaleDateString(),
        items: salesData.map((sale, index) => ({
          'S.No': index + 1,
          'Date': sale.date,
          'Bills': sale.numberOfBills,
          'Tax': `₹${sale.tax.toFixed(2)}`,
          'Amount': `₹${sale.totalSale.toFixed(2)}`
        })),
        totals: {
          'Total Days': salesData.length,
          'Total Bills': salesData.reduce((sum, sale) => sum + sale.numberOfBills, 0),
          'Total Tax': `₹${salesData.reduce((sum, sale) => sum + sale.tax, 0).toFixed(2)}`,
          'Total Amount': `₹${salesData.reduce((sum, sale) => sum + sale.totalSale, 0).toFixed(2)}`
        },
        shopDetails: {
          name: shopDetails?.shopName || 'TapBill Restaurant',
          address: shopDetails?.shopAddress || '',
          phone: shopDetails?.phone || ''
        }
      };

      // Try direct printing first
      let printSuccess = false;
      try {
        printSuccess = await printReport(reportData, { silent: true });
        if (printSuccess) {
          console.log('✅ Day summary report printed successfully');
        }
      } catch (error) {
        console.error('Direct print error:', error);
      }

      // Generate thermal printer format PDF as backup (same as home page)
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
      doc.text('Day Summary Report', layout.centerX, y, { align: 'center' });
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

      // Show result message
      if (printSuccess) {
        alert(`✅ Day summary printed successfully (${printerSettings.selectedWidth})! PDF also saved as backup.`);
      } else {
        alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
      }
    } catch (error) {
      console.error('Error generating day summary:', error);
      alert('Error generating day summary. Please try again.');
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