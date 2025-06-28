import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import DateFilterModal from '@/components/tapbill/DateFilterModal';
import { api, ShopDetails } from '@/services/api';
import { printReceipt, BillData, printReport, ReportData } from '@/services/printService';
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

const DayWiseSales: React.FC = () => {
  const navigate = useNavigate();
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSales, setSelectedSales] = useState<Set<number>>(new Set());
  const [filteredSales, setFilteredSales] = useState<SaleData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  useEffect(() => {
    fetchDailySales();
    api.getShopDetails().then(setShopDetails);
  }, []);

  const fetchDailySales = async () => {
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

      setSales(salesData);
      setFilteredSales(salesData);
    } catch (error) {
      console.error('Error fetching daily sales:', error);
    }
  };

  const navigateToMenu = () => {
    navigate('/menu');
  };

  const handleBack = () => {
    navigate('/report');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const filtered = sales.filter(sale => 
      sale.date.includes(query) || 
      sale.numberOfBills.toString().includes(query) ||
      sale.totalSale.toString().includes(query)
    );
    setFilteredSales(filtered);
  };

  const handleOpenDateFilter = () => {
    setIsDateFilterOpen(true);
  };

  const handleCloseDateFilter = () => {
    setIsDateFilterOpen(false);
  };

  const handleDateFilter = (startDate: Date, endDate: Date) => {
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
    setFilteredSales(filtered);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredSales.map(sale => sale.id));
      setSelectedSales(allIds);
    } else {
      setSelectedSales(new Set());
    }
  };

  const handleSelectSale = (id: number) => {
    const newSelectedSales = new Set(selectedSales);
    if (newSelectedSales.has(id)) {
      newSelectedSales.delete(id);
    } else {
      newSelectedSales.add(id);
    }
    setSelectedSales(newSelectedSales);
  };

  // Generate thermal printer format PDF as backup
  const printSalesReceipt = (salesToPrint: SaleData[], fileName = 'DayWiseSales.pdf') => {
    try {
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
      doc.text('Day-Wise Sales Report', layout.centerX, y, { align: 'center' });
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
      salesToPrint.forEach((sale) => {
        // Format date as DD/MM/YYYY
        const saleDate = new Date(sale.date || new Date());
        const formattedDate = `${saleDate.getDate().toString().padStart(2, '0')}/${(saleDate.getMonth()+1).toString().padStart(2, '0')}/${saleDate.getFullYear()}`;
        doc.text(formattedDate, layout.columns.item, y, { maxWidth: layout.columnWidths.item });
        doc.text(String(sale.numberOfBills || 0), layout.columns.qty, y);
        doc.text(String((sale.tax || 0).toFixed(0)), layout.columns.price, y);
        doc.text(String((sale.totalSale || 0).toFixed(0)), layout.columns.total, y);
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
      console.error('Error generating thermal print PDF:', error);
    }
  };

  const handlePrint = async () => {
    const selected = filteredSales.filter(sale => selectedSales.has(sale.id));
    if (selected.length === 0) {
      alert('Please select sales records to print');
      return;
    }

    // Convert report data to BillData format for direct printing (same as home page)
    const billData: BillData = {
      billNo: `DayWiseSales_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
      items: selected.map((sale, index) => ({
        name: `${sale.date || 'N/A'} (${sale.numberOfBills || 0} bills)`,
        quantity: 1,
        price: sale.totalSale || 0,
        total: sale.totalSale || 0
      })),
      total: selected.reduce((sum, sale) => sum + (sale.totalSale || 0), 0),
      createdAt: new Date(),
      shopDetails: {
        name: shopDetails?.shopName || 'TapBill Restaurant',
        address: shopDetails?.shopAddress || '',
        phone: shopDetails?.phone || ''
      }
    };

    // Try direct printing first (same as home page)
    let printSuccess = false;
    try {
      printSuccess = await printReceipt(billData, { silent: true });
      if (printSuccess) {
        console.log('✅ Day-wise sales report printed successfully');
      }
    } catch (error) {
      console.error('Direct print error:', error);
    }

    // Show success/failure message and handle PDF generation
    const printerSettings = PrinterConfigService.getSettings();
    if (printSuccess) {
      // Printer connected and printing successful - no PDF needed
      alert(`✅ Report printed successfully (${printerSettings.selectedWidth})!`);
    } else {
      // Printer not connected - show error and generate PDF as backup
      printSalesReceipt(selected, 'DayWiseSales_Selected.pdf');
      alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
    }
  };

  const handlePrintSingle = async (sale: SaleData) => {
    // Convert single sale to BillData format for direct printing (same as home page)
    const billData: BillData = {
      billNo: `DayWiseSales_${sale.date}`,
      items: [{
        name: `${sale.date || 'N/A'} (${sale.numberOfBills || 0} bills)`,
        quantity: 1,
        price: sale.totalSale || 0,
        total: sale.totalSale || 0
      }],
      total: sale.totalSale || 0,
      createdAt: new Date(),
      shopDetails: {
        name: shopDetails?.shopName || 'TapBill Restaurant',
        address: shopDetails?.shopAddress || '',
        phone: shopDetails?.phone || ''
      }
    };

    // Try direct printing first (same as home page)
    let printSuccess = false;
    try {
      printSuccess = await printReceipt(billData, { silent: true });
    } catch (error) {
      console.error('Direct print error:', error);
    }

    // Show success/failure message and handle PDF generation
    const printerSettings = PrinterConfigService.getSettings();
    if (printSuccess) {
      // Printer connected and printing successful - no PDF needed
      alert(`✅ Day sales for ${sale.date} printed successfully (${printerSettings.selectedWidth})!`);
    } else {
      // Printer not connected - show error and generate PDF as backup
      printSalesReceipt([sale], `DayWiseSales_${sale.date}.pdf`);
      alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
    }
  };

  const handleExport = async () => {
    try {
      const selectedSalesData = filteredSales.filter(sale => selectedSales.has(sale.id));
      const response = await fetch('http://localhost:5000/api/export/daySummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sales: selectedSalesData,
          type: 'custom',
          startDate: selectedSalesData[0]?.date,
          endDate: selectedSalesData[selectedSalesData.length - 1]?.date
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `day_wise_sales_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export sales data');
      }
    } catch (error) {
      console.error('Error exporting sales:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={handleBack} className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg">←</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Day Wise Sales
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

      {/* Main Content with spacing */}
      <div className="flex-1 px-8 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Search and Actions */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className="relative w-1/2">
                <input
                  type="text"
                  placeholder="Search by Date, Number of Bills, or Amount"
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
              <div className="flex ml-4 justify-end flex-1">
                <button 
                  onClick={handlePrint} 
                  className="bg-[rgb(56,224,120)] text-white h-10 px-6 rounded-lg mr-2"
                >
                  Print
                </button>
                <button 
                  onClick={handleExport} 
                  className="bg-[#F5F5F5] text-black h-10 px-6 rounded-lg"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedSales.size === filteredSales.length && filteredSales.length > 0}
                      className="mx-auto h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">S.No</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Date</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">No of Bills</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Tax</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Total Sales</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale, index) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSales.has(sale.id)}
                        onChange={() => handleSelectSale(sale.id)}
                        className="mx-auto h-4 w-4"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">{index + 1}</td>
                    <td className="px-6 py-4 text-center">
                      {sale.date ? (() => {
                        const saleDate = new Date(sale.date);
                        return `${saleDate.getDate().toString().padStart(2, '0')}/${(saleDate.getMonth()+1).toString().padStart(2, '0')}/${saleDate.getFullYear()}`;
                      })() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">{sale.numberOfBills || 0}</td>
                    <td className="px-6 py-4 text-center">₹{(sale.tax || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">₹{(sale.totalSale || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handlePrintSingle(sale)}
                        className="inline-flex items-center justify-center bg-gray-100 hover:bg-[rgb(56,224,120)] text-gray-700 hover:text-white rounded-full p-2 transition-colors"
                        title="Print"
                        aria-label="Print Sale"
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

      <DateFilterModal 
        isOpen={isDateFilterOpen} 
        onClose={handleCloseDateFilter} 
        onFilter={handleDateFilter} 
      />
    </div>
  );
};

export default DayWiseSales; 