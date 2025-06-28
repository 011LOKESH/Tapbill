import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import MenuCategories from "./MenuCategories";
import PricingArea from "./PricingArea";
import jsPDF from 'jspdf';
import { api, Customer, ShopDetails } from '@/services/api';
import { printReceipt, generateReceiptHTML, getAvailablePrinters, BillData } from '@/services/printService';
import BarcodeScanner from './BarcodeScanner';
import BarcodeManager from './BarcodeManager';
import AddMissingItemModal from '../modals/AddMissingItemModal';
import BarcodeService from '@/services/barcodeService';
import PrinterConfigService from '@/services/printerConfig';

interface CustomerSectionProps {
  onSearch?: (query: string) => void;
}

interface BillItem {
  _id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Menu {
  id: string;
  name: string;
  items: BillItem[];
}

interface LastBillDetails {
  items: BillItem[];
  total: number;
  timestamp: Date;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showLastBillPopup, setShowLastBillPopup] = useState(false);
  const [lastBillDetails, setLastBillDetails] = useState<LastBillDetails | null>(null);
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [billNo, setBillNo] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');

  // Barcode scanning states
  const [isBarcodeActive, setIsBarcodeActive] = useState(false);
  const [showBarcodeManager, setShowBarcodeManager] = useState(false);
  const [barcodeMessage, setBarcodeMessage] = useState<string>('');
  const [showAddMissingItem, setShowAddMissingItem] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState<string>('');

  // Initialize with Menu 1 on component mount
  useEffect(() => {
    const initialMenu: Menu = {
      id: Date.now().toString(),
      name: "Menu 1",
      items: []
    };
    setMenus([initialMenu]);
    setActiveMenuId(initialMenu.id);
  }, []);

  // Load available printers on component mount
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const printers = await getAvailablePrinters();
        setAvailablePrinters(printers);
        if (printers.length > 0) {
          // Set default printer (first one or find default)
          const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
          setSelectedPrinter(defaultPrinter?.name || '');
        }
      } catch (error) {
        console.error('Error loading printers:', error);
      }
    };
    loadPrinters();
  }, []);

  // Fetch last bill details on component mount
  useEffect(() => {
    const fetchLastBill = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
        const response = await fetch('http://localhost:5000/api/last-bill', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch last bill');
        }
        const data = await response.json();
        console.log('Received last bill data:', data);
        setLastBillDetails({
          items: data.items,
          total: data.total,
          timestamp: new Date(data.timestamp)
        });
      } catch (error) {
        console.error('Error fetching last bill:', error);
      }
    };

    fetchLastBill();
  }, []);

  // Fetch shop details, customers, and last bill number
  useEffect(() => {
    api.getShopDetails().then(setShopDetails);
    api.getCustomers().then(setCustomers);
    api.getLastBill().then(bill => setBillNo(bill && bill._id ? bill._id + 1 : 1000000001));
  }, []);

  const handleAddCustomer = () => {
    navigate('/customer-details');
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value);
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    setSelectedCustomer(null);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
  };

  const handleItemClick = (name: string, price: number) => {
    if (!activeMenuId) return;
    
    setMenus(prevMenus =>
      prevMenus.map(menu =>
        menu.id === activeMenuId
          ? {
              ...menu,
              items: [
                ...menu.items.filter(i => i.name !== name),
                {
                  _id: Date.now(),
                  name,
                  price,
                  quantity: (menu.items.find(i => i.name === name)?.quantity || 0) + 1,
                  total: price * ((menu.items.find(i => i.name === name)?.quantity || 0) + 1)
                }
              ]
            }
          : menu
      )
    );
  };

  const handleUpdateQuantity = (menuId: string, itemId: number | string, quantity: number) => {
    if (quantity < 0) return;
    
    setMenus(prevMenus =>
      prevMenus.map(menu =>
        menu.id === menuId
          ? {
              ...menu,
              items: menu.items.map(item =>
                item._id.toString() === itemId.toString()
                  ? { 
                      ...item, 
                      quantity,
                      total: item.price * quantity
                    } 
                  : item
              ).filter(item => item.quantity > 0)
            }
          : menu
      )
    );
  };

  const handleDeleteItem = (menuId: string, itemId: number | string) => {
    setMenus(prevMenus =>
      prevMenus.map(menu =>
        menu.id === menuId
          ? {
              ...menu,
              items: menu.items.filter(item => item._id.toString() !== itemId.toString())
            }
          : menu
      )
    );
  };

  const handleAddMenu = () => {
    const newMenu: Menu = {
      id: Date.now().toString(),
      name: `Menu ${menus.length + 1}`,
      items: []
    };
    setMenus(prev => [...prev, newMenu]);
    setActiveMenuId(newMenu.id);
    // Clear customer selection after adding new menu
    setSelectedCustomer(null);
    setCustomerSearch('');
  };

  const handleDeleteMenu = (menuId: string) => {
    // Don't allow deleting Menu 1
    if (menus.find(menu => menu.id === menuId)?.name === "Menu 1") return;

    setMenus(prev => prev.filter(menu => menu.id !== menuId));
    if (activeMenuId === menuId) {
      setActiveMenuId(menus.length > 1 ? menus[0].id : null);
    }
  };

  // Barcode scanning function
  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    setBarcodeMessage('');

    try {
      const result = await BarcodeService.findItemByBarcode(barcode);

      if (result.success && result.item) {
        // Add item to current menu
        if (activeMenu) {
          const existingItemIndex = activeMenu.items.findIndex(item => item.name === result.item!.name);

          if (existingItemIndex >= 0) {
            // Increase quantity if item already exists
            setMenus(prev => prev.map(menu =>
              menu.id === activeMenuId
                ? {
                    ...menu,
                    items: menu.items.map((item, index) =>
                      index === existingItemIndex
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                    )
                  }
                : menu
            ));
          } else {
            // Add new item
            const newItem: BillItem = {
              _id: Date.now(),
              name: result.item.name,
              price: result.item.price,
              quantity: 1
            };

            setMenus(prev => prev.map(menu =>
              menu.id === activeMenuId
                ? { ...menu, items: [...menu.items, newItem] }
                : menu
            ));
          }

          setBarcodeMessage(`✅ Added: ${result.item.name} (₹${result.item.price})`);

          // Clear message after 3 seconds
          setTimeout(() => setBarcodeMessage(''), 3000);
        }
      } else {
        // Item not found - show add missing item modal
        console.log('Item not found for barcode:', barcode);
        setMissingBarcode(barcode);
        setShowAddMissingItem(true);
        setBarcodeMessage(`🔍 Item not found for barcode: ${barcode}`);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      // Check if it's a 404 error (item not found)
      if (error instanceof Error && error.message.includes('No item found')) {
        setMissingBarcode(barcode);
        setShowAddMissingItem(true);
        setBarcodeMessage(`🔍 Item not found for barcode: ${barcode}`);
      } else {
        setBarcodeMessage(`❌ Error processing barcode: ${barcode}`);
        setTimeout(() => setBarcodeMessage(''), 5000);
      }
    }
  };

  // Handle adding new item from missing barcode modal
  const handleMissingItemAdded = (newItem: any) => {
    console.log('New item added:', newItem);

    // Add the new item to the current menu
    if (activeMenu) {
      const billItem: BillItem = {
        _id: Date.now(),
        name: newItem.name,
        price: newItem.price,
        quantity: 1
      };

      setMenus(prev => prev.map(menu =>
        menu.id === activeMenuId
          ? { ...menu, items: [...menu.items, billItem] }
          : menu
      ));

      setBarcodeMessage(`✅ Added new item: ${newItem.name} (Rs.${newItem.price})`);
      setTimeout(() => setBarcodeMessage(''), 3000);
    }

    // Trigger a refresh of the MenuCategories component by dispatching a custom event
    window.dispatchEvent(new CustomEvent('menuItemAdded', {
      detail: { item: newItem }
    }));
  };

  const handlePay = async () => {
    if (activeMenu) {
      const total = activeMenu.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Save the bill to the database
      const billData = {
        items: activeMenu.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total,
        createdAt: new Date()
      };

      console.log('Bill data to save:', billData);

      try {
        const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
        const response = await fetch('http://localhost:5000/api/bill-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(billData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save bill');
        }

        // Clear the current menu items
        setMenus(prevMenus =>
          prevMenus.map(menu =>
            menu.id === activeMenu.id
              ? { ...menu, items: [] }
              : menu
          )
        );

        // Save last bill details in state or context
        setLastBillDetails({
          items: activeMenu.items,
          total,
          timestamp: new Date(),
        });

      } catch (error) {
        console.error('Error saving bill:', error);
      }
    }
  };

  const activeMenu = menus.find(menu => menu.id === activeMenuId);
  const currentTotal = activeMenu?.items.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;

  // Helper to format date and time in DD/MM/YYYY HH:MM format
  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Dummy phone number for now (replace with actual selected customer phone if available)
  const customerPhone = '';

  // Print Bill handler
  const handlePrintBill = async () => {
    if (!activeMenu || activeMenu.items.length === 0 || isPrinting) return;
    setIsPrinting(true);
    const total = activeMenu.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const billData = {
      items: activeMenu.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      total,
      createdAt: new Date()
    };
    try {
      const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
      const response = await fetch('http://localhost:5000/api/bill-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(billData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save bill');
      }
      const savedBill = await response.json();
      // Clear the current menu items
      setMenus(prevMenus =>
        prevMenus.map(menu =>
          menu.id === activeMenu.id
            ? { ...menu, items: [] }
            : menu
        )
      );
      setLastBillDetails({
        items: activeMenu.items,
        total,
        timestamp: new Date(),
      });
      // Clear customer selection after printing
      setSelectedCustomer(null);
      setCustomerSearch('');

      // Prepare bill data for printing
      const printBillData: BillData = {
        billNo: savedBill.billNo || 'NA',
        items: activeMenu.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total,
        createdAt: new Date(),
        shopDetails: {
          name: shopDetails?.shopName || 'TapBill Restaurant',
          address: shopDetails?.shopAddress || '',
          phone: shopDetails?.phone || ''
        }
      };

      // Try direct printing first
      let printSuccess = false;
      try {
        if (selectedPrinter) {
          printSuccess = await printReceipt(printBillData, {
            printerName: selectedPrinter,
            silent: true
          });
        } else {
          printSuccess = await printReceipt(printBillData, { silent: true });
        }

        if (printSuccess) {
          console.log('✅ Bill printed successfully to printer');
        } else {
          console.log('⚠️ Direct printing failed, generating PDF as fallback');
        }
      } catch (error) {
        console.error('Print error:', error);
        console.log('⚠️ Direct printing failed, generating PDF as fallback');
      }

      // Always generate PDF as backup (or if printing failed)
      const printerSettings = PrinterConfigService.getSettings();
      const pdfFormat = PrinterConfigService.getPDFFormat(printerSettings.selectedWidth);
      const layout = PrinterConfigService.getPDFLayout(printerSettings.selectedWidth);

      // Validate layout before generating PDF
      if (!PrinterConfigService.validatePDFLayout(printerSettings.selectedWidth)) {
        console.warn('PDF layout validation failed, using default 80mm layout');
        // Fallback to 80mm layout if validation fails
        const fallbackLayout = PrinterConfigService.getPDFLayout('80mm');
        const fallbackFormat = PrinterConfigService.getPDFFormat('80mm');
        const doc = new jsPDF({ unit: 'pt', format: fallbackFormat });
      } else {
        console.log(PrinterConfigService.getLayoutSummary(printerSettings.selectedWidth));
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
      // Customer details
      doc.setFontSize(layout.bodyFontSize);
      // Stack vertically for both 58mm and 80mm to prevent collision
      doc.text(`Customer: ${selectedCustomer?.name || '-'}`, layout.leftMargin, y);
      addSpace();
      doc.text(`Phone: ${selectedCustomer?.contact || '-'}`, layout.leftMargin, y);
      addSpace();
      dottedLine();
      // Bill info
      // Stack vertically for both 58mm and 80mm to prevent cutoff
      doc.text(`Bill No: ${savedBill.billNo || '-'}`, layout.leftMargin, y);
      addSpace();
      doc.text(`Date: ${formatDateTime(new Date())}`, layout.leftMargin, y);
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
      activeMenu.items.forEach((item) => {
        doc.text(item.name, layout.columns.item, y, { maxWidth: layout.columnWidths.item });
        doc.text(String(item.quantity), layout.columns.qty, y);
        doc.text(String(item.price.toFixed(2)), layout.columns.price, y);
        doc.text(String((item.price * item.quantity).toFixed(2)), layout.columns.total, y);
        addSpace(layout.lineHeight);
      });
      dottedLine();
      // Totals
      const totalQty = activeMenu.items.reduce((sum, i) => sum + i.quantity, 0);
      doc.setFontSize(layout.totalFontSize);
      doc.setFont(undefined, 'bold');
      // Stack vertically for both layouts to ensure proper positioning
      doc.text(`Total Qty: ${String(totalQty)}`, layout.leftMargin, y);
      addSpace();
      doc.text(`Total: Rs.${String(total.toFixed(2))}`, layout.leftMargin, y);
      addSpace();
      doc.setFont(undefined, 'normal');
      dottedLine();
      // Footer
      doc.setFontSize(layout.bodyFontSize);
      addSpace(layout.sectionSpacing);
      doc.text('Thank You, Visit again.', layout.centerX, y, { align: 'center' });

      // Save PDF (always as backup) with printer width in filename
      const fileName = `Bill_${savedBill.billNo || 'NA'}_${printerSettings.selectedWidth}.pdf`;
      doc.save(fileName);

      // Show success message with printer width info
      if (printSuccess) {
        alert(`✅ Bill printed successfully (${printerSettings.selectedWidth})! PDF also saved as backup.`);
      } else {
        alert(`⚠️ Direct printing failed. PDF saved successfully (${printerSettings.selectedWidth}). Please check your printer connection.`);
      }
    } catch (error) {
      console.error('Error saving/printing bill:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex w-full gap-4">
      <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <div className="w-[240px] relative">
          <input
            type="text"
            value={selectedCustomer ? selectedCustomer.name : customerSearch}
            onChange={handleCustomerSearchChange}
            placeholder="Customer Name"
            className="w-full bg-white border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] border-solid focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent text-sm"
            autoComplete="off"
          />
          {customerSearch && !selectedCustomer && (
            <div className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-y-auto">
              {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                <div key={c._id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectCustomer(c)}>
                  {c.name} ({c.contact})
                </div>
              ))}
              {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                <div className="px-4 py-2 text-gray-400">No customers found</div>
              )}
            </div>
          )}
        </div>
        <div className="w-[240px]">
          <button
            onClick={handleAddCustomer}
            className="w-full bg-white border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] border-solid hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Add Customer +
          </button>
        </div>
      </div>

      {/* Barcode Controls */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setIsBarcodeActive(!isBarcodeActive)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isBarcodeActive
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isBarcodeActive ? '📱 Scanner ON' : '📱 Scanner OFF'}
        </button>
        <button
          onClick={() => setShowBarcodeManager(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          🏷️ Manage Barcodes
        </button>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        isActive={isBarcodeActive}
        className="mb-4"
      />

      {/* Barcode Message */}
      {barcodeMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          barcodeMessage.includes('✅')
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {barcodeMessage}
        </div>
      )}

        <div className="w-[500px] relative">
          <input
            type="text"
            placeholder="Search by Code/Barcode/Name"
            className="w-full bg-gray-100 border h-10 pl-12 pr-4 rounded-xl border-[rgba(224,224,224,1)] border-solid focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[rgb(115,115,115)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {activeMenu && (
          <>
            <PricingArea 
              items={activeMenu.items} 
              onUpdateQuantity={(id, quantity) => handleUpdateQuantity(activeMenu.id, id, quantity)}
              onDeleteItem={(id) => handleDeleteItem(activeMenu.id, id)}
            />
            <div className="w-[500px] bg-[rgb(56,224,120)] rounded-2xl p-4 flex justify-between items-center relative">
              <div className="flex items-center gap-2">
                <span className="text-black font-bold text-lg">Last Bill</span>
                <button 
                  onClick={() => setShowLastBillPopup(true)}
                  className="p-1 hover:bg-black/10 rounded-full transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              <span className="text-black font-bold text-lg">
                ₹{lastBillDetails?.total.toFixed(2) || "0.00"}
              </span>
              {showLastBillPopup && lastBillDetails && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg p-4 z-50 w-80">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800">Last Bill Details</span>
                    <button 
                      onClick={() => setShowLastBillPopup(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-2">
                    {lastBillDetails.items.map((item) => (
                      <div key={item._id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">Total Amount</span>
                        <span className="font-bold text-lg">₹{lastBillDetails.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex overflow-x-auto">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer ${
                  activeMenuId === menu.id
                    ? 'border-[rgb(56,224,120)] text-[rgb(56,224,120)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveMenuId(menu.id)}
              >
                <span className="text-sm font-medium">{menu.name}</span>
                {menu.name !== "Menu 1" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMenu(menu.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex h-10 w-full items-center rounded-xl bg-white border border-[rgba(224,224,224,1)] hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleAddMenu}>
          <div className="flex h-full items-center justify-center px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-600">
            Add Menu
          </div>
        </div>
        <div className="flex justify-between gap-4">
          <button 
            onClick={handlePay}
            className="bg-[rgb(56,224,120)] text-black font-bold py-2 px-12 rounded-2xl hover:bg-[rgb(46,204,110)] transition-colors"
          >
            Pay
          </button>
          <button onClick={handlePrintBill} disabled={isPrinting} className="bg-[rgb(56,224,120)] text-black font-bold py-2 px-24 rounded-2xl hover:bg-[rgb(46,204,110)] transition-colors">
            Print Bill
          </button>
        </div>
        <MenuCategories onItemClick={handleItemClick} />
      </div>

      {/* Barcode Manager Modal */}
      <BarcodeManager
        isOpen={showBarcodeManager}
        onClose={() => setShowBarcodeManager(false)}
        onBarcodeUpdated={() => {
          // Optionally refresh data or show success message
          console.log('Barcode updated successfully');
        }}
      />

      {/* Add Missing Item Modal */}
      <AddMissingItemModal
        isOpen={showAddMissingItem}
        onClose={() => setShowAddMissingItem(false)}
        barcode={missingBarcode}
        onItemAdded={handleMissingItemAdded}
      />
    </div>
  );
};

export default CustomerSection;
