import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DateFilterModal from '@/components/tapbill/DateFilterModal';

interface SaleData {
  id: number;
  date: string;
  numberOfBills: number;
  tax: number;
  totalSale: number;
}

const DayWiseSales: React.FC = () => {
  const navigate = useNavigate();
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSales, setSelectedSales] = useState<Set<number>>(new Set());
  const [filteredSales, setFilteredSales] = useState<SaleData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);

  useEffect(() => {
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    try {
      // Fetch all bills from the database
      const response = await fetch('http://localhost:5000/api/bill-items');
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

  const handlePrint = () => {
    console.log('Printing selected sales:', Array.from(selectedSales));
  };

  const handleExport = () => {
    console.log('Exporting selected sales:', Array.from(selectedSales));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg">☰</button>
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
                    <td className="px-6 py-4 text-center">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">{sale.numberOfBills}</td>
                    <td className="px-6 py-4 text-center">₹{sale.tax.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">₹{sale.totalSale.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handlePrint()}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        🖨️
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