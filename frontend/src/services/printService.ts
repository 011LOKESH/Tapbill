// Print Service for TapBill Desktop App
// Handles both direct printing and PDF generation

import PrinterConfigService, { PrinterWidth } from './printerConfig';

export interface PrintOptions {
  showDialog?: boolean;
  printerName?: string;
  copies?: number;
  silent?: boolean;
}

export interface BillData {
  billNo: string | number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  createdAt: Date | string;
  shopDetails?: {
    name: string;
    address: string;
    phone: string;
  };
}

// Check if running in Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

// Generate dynamic CSS based on printer width
const generateReceiptCSS = (width: PrinterWidth): string => {
  const config = PrinterConfigService.getCSSConfig(width);
  const columns = PrinterConfigService.getColumnWidths(width);

  return `
    <style>
      body {
        font-family: 'Courier New', monospace;
        font-size: ${config.fontSize};
        line-height: ${config.lineHeight};
        margin: 0;
        padding: ${config.padding};
        width: ${config.bodyWidth};
        background: white;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line {
        border-bottom: 1px dashed #000;
        margin: 4px 0;
        height: 1px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        margin: 2px 0;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        margin: 1px 0;
        font-size: ${config.itemFontSize};
      }
      .item-name {
        flex: 1;
        padding-right: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .item-qty {
        width: ${columns.qty};
        text-align: center;
      }
      .item-price {
        width: ${columns.price};
        text-align: right;
      }
      .item-total {
        width: ${columns.total};
        text-align: right;
      }
      .total-section {
        margin-top: 8px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 8px;
        font-size: ${config.itemFontSize};
      }
      .header {
        font-size: ${config.headerFontSize};
        font-weight: bold;
      }
      @media print {
        body { margin: 0; }
      }
    </style>
  `;
};

// Generate HTML content for thermal receipt printing
export const generateReceiptHTML = (billData: BillData, printerWidth?: PrinterWidth): string => {
  const width = printerWidth || PrinterConfigService.getSettings().selectedWidth;
  const date = new Date(billData.createdAt);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();
  
  const totalQty = billData.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${generateReceiptCSS(width)}
    </head>
    <body>
      <div class="center bold">
        ${billData.shopDetails?.name || 'TapBill Restaurant'}
      </div>
      ${billData.shopDetails?.address ? `<div class="center">${billData.shopDetails.address}</div>` : ''}
      ${billData.shopDetails?.phone ? `<div class="center">Ph: ${billData.shopDetails.phone}</div>` : ''}
      
      <div class="line"></div>
      
      <div class="row">
        <span>Bill No: ${billData.billNo}</span>
        <span>${formattedDate}</span>
      </div>
      <div class="row">
        <span>Time: ${formattedTime}</span>
      </div>
      
      <div class="line"></div>
      
      <div class="row bold">
        <span class="item-name">Item</span>
        <span class="item-qty">Qty</span>
        <span class="item-price">Rate</span>
        <span class="item-total">Amount</span>
      </div>
      
      <div class="line"></div>
      
      ${billData.items.map(item => `
        <div class="item-row">
          <span class="item-name">${item.name}</span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-price">₹${item.price.toFixed(2)}</span>
          <span class="item-total">₹${item.total.toFixed(2)}</span>
        </div>
      `).join('')}
      
      <div class="line"></div>
      
      <div class="total-section">
        <div class="row">
          <span>Total Qty: ${totalQty}</span>
          <span>Total: ₹${billData.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="line"></div>
      
      <div class="footer">
        Thank You, Visit again.
      </div>
    </body>
    </html>
  `;
};

// Print receipt directly to printer
export const printReceipt = async (billData: BillData, options: PrintOptions = {}): Promise<boolean> => {
  if (!isElectron()) {
    console.warn('Direct printing only available in Electron environment');
    return false;
  }

  try {
    // Get current printer settings
    const settings = PrinterConfigService.getSettings();
    const printerWidth = settings.selectedWidth;

    // Generate HTML with dynamic width
    const htmlContent = generateReceiptHTML(billData, printerWidth);

    // Get dynamic print options for Electron
    const electronOptions = PrinterConfigService.getElectronPrintOptions(printerWidth);
    const printOptions = {
      ...electronOptions,
      silent: options.silent !== false,
      copies: options.copies || 1
    };

    let result;
    if (options.printerName) {
      // Print to specific printer
      result = await (window as any).electronAPI.printToPrinter(htmlContent, options.printerName, printOptions);
    } else {
      // Print to default printer
      result = await (window as any).electronAPI.printReceipt(htmlContent, printOptions);
    }

    console.log(`Print result (${printerWidth}):`, result);
    return result.success && result.printed;
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
};

// Get available printers
export const getAvailablePrinters = async (): Promise<any[]> => {
  if (!isElectron()) {
    return [];
  }

  try {
    const result = await (window as any).electronAPI.getPrinters();
    return result.success ? result.printers : [];
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
};

// Print with user printer selection
export const printWithDialog = async (billData: BillData): Promise<boolean> => {
  const printers = await getAvailablePrinters();
  
  if (printers.length === 0) {
    alert('No printers found. Please check your printer connections.');
    return false;
  }

  // For now, use default printer. In future, can add printer selection dialog
  return await printReceipt(billData, { silent: false });
};

// Extended interfaces for different report types
export interface ReportData {
  title: string;
  date: string;
  items: Array<{
    [key: string]: any;
  }>;
  totals?: {
    [key: string]: number | string;
  };
  shopDetails?: {
    name: string;
    address: string;
    phone: string;
  };
}

export interface DeletedBillData {
  id: string;
  billNo: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  tax: number;
  netAmount: number;
  deletedAt: string;
}

export interface DeletedItemData {
  _id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  deletedAt: string;
}

// Generate HTML for reports (bills, sales, etc.)
export const generateReportHTML = (reportData: ReportData): string => {
  const itemsHTML = reportData.items.map((item, index) => {
    const keys = Object.keys(item);
    return `
      <div class="item-row">
        <span class="item-sno">${index + 1}</span>
        ${keys.map(key => `<span class="item-field">${item[key]}</span>`).join('')}
      </div>
    `;
  }).join('');

  const totalsHTML = reportData.totals ? Object.entries(reportData.totals).map(([key, value]) =>
    `<div class="row"><span>${key}:</span><span>${value}</span></div>`
  ).join('') : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.2;
          margin: 0;
          padding: 8px;
          width: 72mm;
          background: white;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line {
          border-bottom: 1px dashed #000;
          margin: 4px 0;
          height: 1px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin: 1px 0;
          font-size: 10px;
        }
        .item-sno { width: 15px; }
        .item-field {
          flex: 1;
          padding: 0 2px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .total-section {
          margin-top: 8px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 8px;
          font-size: 11px;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="center bold">
        ${reportData.shopDetails?.name || 'TapBill Restaurant'}
      </div>
      ${reportData.shopDetails?.address ? `<div class="center">${reportData.shopDetails.address}</div>` : ''}
      ${reportData.shopDetails?.phone ? `<div class="center">Ph: ${reportData.shopDetails.phone}</div>` : ''}

      <div class="line"></div>

      <div class="center bold">${reportData.title}</div>
      <div class="center">${reportData.date}</div>

      <div class="line"></div>

      ${itemsHTML}

      <div class="line"></div>

      <div class="total-section">
        ${totalsHTML}
      </div>

      <div class="line"></div>

      <div class="footer">
        Thank You, Visit again.
      </div>
    </body>
    </html>
  `;
};

// Print any report type
export const printReport = async (reportData: ReportData, options: PrintOptions = {}): Promise<boolean> => {
  if (!isElectron()) {
    console.warn('Direct printing only available in Electron environment');
    return false;
  }

  try {
    const htmlContent = generateReportHTML(reportData);

    let result;
    if (options.printerName) {
      result = await (window as any).electronAPI.printToPrinter(htmlContent, options.printerName, {
        silent: options.silent !== false,
        copies: options.copies || 1
      });
    } else {
      result = await (window as any).electronAPI.printReceipt(htmlContent, {
        silent: options.silent !== false,
        copies: options.copies || 1
      });
    }

    console.log('Report print result:', result);
    return result.success && result.printed;
  } catch (error) {
    console.error('Report print error:', error);
    return false;
  }
};

// Fallback: Generate and download PDF (existing functionality)
export const downloadReceiptPDF = (billData: BillData, fileName?: string): void => {
  // This will be implemented to maintain existing PDF functionality
  console.log('PDF download fallback for:', billData.billNo);
  // The existing jsPDF code will be called here as fallback
};
