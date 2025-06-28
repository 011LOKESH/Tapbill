// Printer Configuration Service for Dynamic Width Support

export type PrinterWidth = '58mm' | '80mm';

export interface PrinterConfig {
  width: PrinterWidth;
  name: string;
  autoDetected: boolean;
}

export interface PrinterSettings {
  selectedWidth: PrinterWidth;
  selectedPrinter: string;
  autoDetect: boolean;
}

export class PrinterConfigService {
  private static readonly STORAGE_KEY = 'tapbill_printer_config';
  
  // Default configuration
  private static readonly DEFAULT_CONFIG: PrinterSettings = {
    selectedWidth: '80mm',
    selectedPrinter: '',
    autoDetect: true
  };

  // Known printer models and their typical paper widths
  private static readonly PRINTER_WIDTH_MAP: Record<string, PrinterWidth> = {
    // 58mm printers
    'EPSON TM-T20II': '58mm',
    'EPSON TM-T82II': '58mm',
    'EPSON TM-T88V': '58mm',
    'Star TSP143III': '58mm',
    'Citizen CT-S310II': '58mm',
    'BIXOLON SRP-275III': '58mm',
    
    // 80mm printers
    'EPSON TM-T88VI': '80mm',
    'EPSON TM-T20III': '80mm',
    'Star TSP654II': '80mm',
    'Citizen CT-S801II': '80mm',
    'BIXOLON SRP-350III': '80mm',
    'HP Value Receipt Printer': '80mm'
  };

  // Get current printer settings
  static getSettings(): PrinterSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
    return this.DEFAULT_CONFIG;
  }

  // Save printer settings
  static saveSettings(settings: Partial<PrinterSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      console.log('Printer settings saved:', updated);
    } catch (error) {
      console.error('Error saving printer settings:', error);
    }
  }

  // Auto-detect printer width based on printer name
  static detectPrinterWidth(printerName: string): PrinterWidth | null {
    if (!printerName) return null;
    
    // Check exact matches first
    if (this.PRINTER_WIDTH_MAP[printerName]) {
      return this.PRINTER_WIDTH_MAP[printerName];
    }
    
    // Check partial matches
    const upperName = printerName.toUpperCase();
    for (const [model, width] of Object.entries(this.PRINTER_WIDTH_MAP)) {
      if (upperName.includes(model.toUpperCase()) || model.toUpperCase().includes(upperName)) {
        return width;
      }
    }
    
    // Default heuristics
    if (upperName.includes('58') || upperName.includes('T20') || upperName.includes('T82')) {
      return '58mm';
    }
    if (upperName.includes('80') || upperName.includes('T88') || upperName.includes('654')) {
      return '80mm';
    }
    
    return null; // Unknown, use manual setting
  }

  // Get CSS configuration for current printer width
  static getCSSConfig(width: PrinterWidth) {
    const configs = {
      '58mm': {
        bodyWidth: '50mm',
        fontSize: '9px',
        lineHeight: '1.1',
        padding: '4px',
        itemFontSize: '8px',
        headerFontSize: '10px'
      },
      '80mm': {
        bodyWidth: '72mm',
        fontSize: '12px',
        lineHeight: '1.2',
        padding: '8px',
        itemFontSize: '11px',
        headerFontSize: '14px'
      }
    };
    return configs[width];
  }

  // Get Electron print options for current printer width
  static getElectronPrintOptions(width: PrinterWidth) {
    const widthInMicrometers = width === '58mm' ? 58000 : 80000;
    return {
      pageSize: {
        width: widthInMicrometers,
        height: 200000 // Auto height
      },
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    };
  }

  // Get PDF format for current printer width
  static getPDFFormat(width: PrinterWidth): [number, number] {
    // 1 point = 1/72 inch
    // 58mm ≈ 2.28 inches ≈ 164 points
    // 80mm ≈ 3.15 inches ≈ 227 points
    return width === '58mm' ? [164, 600] : [227, 600];
  }

  // Get PDF layout configuration for dynamic content positioning
  static getPDFLayout(width: PrinterWidth) {
    if (width === '58mm') {
      return {
        // Paper dimensions
        paperWidth: 164,
        paperHeight: 600,

        // Margins and spacing
        leftMargin: 8,
        rightMargin: 8,
        topMargin: 15,
        lineHeight: 12,
        sectionSpacing: 6,

        // Font sizes
        headerFontSize: 10,
        subHeaderFontSize: 8,
        bodyFontSize: 7,
        itemFontSize: 6,
        totalFontSize: 8,

        // Column positions (from left margin) - No S.No column for 58mm
        columns: {
          item: 8,       // Item name column (starts from left margin)
          qty: 75,       // Quantity column
          price: 95,     // Price column
          total: 125     // Total column
        },

        // Column widths for text wrapping
        columnWidths: {
          item: 65,      // Item name max width (increased since no S.No)
          qty: 15,       // Quantity width
          price: 25,     // Price width
          total: 20      // Total width
        },

        // Content area
        contentWidth: 148, // paperWidth - leftMargin - rightMargin
        centerX: 82        // paperWidth / 2
      };
    } else {
      // 80mm layout (current/standard)
      return {
        // Paper dimensions
        paperWidth: 227,
        paperHeight: 600,

        // Margins and spacing
        leftMargin: 15,
        rightMargin: 15,
        topMargin: 20,
        lineHeight: 16,
        sectionSpacing: 8,

        // Font sizes
        headerFontSize: 14,
        subHeaderFontSize: 11,
        bodyFontSize: 10,
        itemFontSize: 9,
        totalFontSize: 11,

        // Column positions (from left margin) - No S.No column for 80mm
        columns: {
          item: 15,      // Item name column (starts from left margin)
          qty: 120,      // Quantity column
          price: 150,    // Price column
          total: 185     // Total column
        },

        // Column widths for text wrapping
        columnWidths: {
          item: 100,     // Item name max width (increased since no S.No)
          qty: 25,       // Quantity width
          price: 30,     // Price width
          total: 35      // Total width
        },

        // Content area
        contentWidth: 197, // paperWidth - leftMargin - rightMargin
        centerX: 114       // paperWidth / 2 (rounded)
      };
    }
  }

  // Get column widths for different printer sizes
  static getColumnWidths(width: PrinterWidth) {
    if (width === '58mm') {
      return {
        name: 'flex: 1',
        qty: '15px',
        price: '30px',
        total: '35px'
      };
    } else {
      return {
        name: 'flex: 1',
        qty: '20px',
        price: '40px',
        total: '50px'
      };
    }
  }

  // Validate printer width
  static isValidWidth(width: string): width is PrinterWidth {
    return width === '58mm' || width === '80mm';
  }

  // Validate PDF layout configuration
  static validatePDFLayout(width: PrinterWidth): boolean {
    const layout = this.getPDFLayout(width);

    // Check if all column positions fit within paper width
    const maxColumnPosition = Math.max(
      layout.columns.item + layout.columnWidths.item,
      layout.columns.qty + layout.columnWidths.qty,
      layout.columns.price + layout.columnWidths.price,
      layout.columns.total + layout.columnWidths.total
    );

    const availableWidth = layout.paperWidth - layout.rightMargin;

    if (maxColumnPosition > availableWidth) {
      console.warn(`PDF layout validation failed for ${width}: Content exceeds paper width`);
      return false;
    }

    console.log(`PDF layout validation passed for ${width}`);
    return true;
  }

  // Get layout summary for debugging
  static getLayoutSummary(width: PrinterWidth): string {
    const layout = this.getPDFLayout(width);
    return `
      ${width} Layout Summary:
      - Paper: ${layout.paperWidth} x ${layout.paperHeight} pts
      - Content Width: ${layout.contentWidth} pts
      - Font Sizes: Header(${layout.headerFontSize}), Body(${layout.bodyFontSize}), Items(${layout.itemFontSize})
      - Columns: Item(${layout.columns.item}), Qty(${layout.columns.qty}), Price(${layout.columns.price}), Total(${layout.columns.total})
    `;
  }
}

export default PrinterConfigService;
