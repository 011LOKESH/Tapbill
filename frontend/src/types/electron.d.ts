// TypeScript declarations for Electron API

export interface PrintOptions {
  silent?: boolean;
  copies?: number;
  margins?: {
    marginType?: string;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: {
    width?: number;
    height?: number;
  };
}

export interface PrintResult {
  success: boolean;
  printed?: boolean;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
  options: Record<string, any>;
}

export interface GetPrintersResult {
  success: boolean;
  printers?: PrinterInfo[];
  error?: string;
}

declare global {
  interface Window {
    electronAPI: {
      // Print functions
      printReceipt: (htmlContent: string, options?: PrintOptions) => Promise<PrintResult>;
      printToPrinter: (htmlContent: string, printerName: string, options?: PrintOptions) => Promise<PrintResult>;
      getPrinters: () => Promise<GetPrintersResult>;
      
      // Backend functions
      getBackendStatus: () => Promise<{ status: string; code?: number }>;
      restartBackend: () => Promise<{ success: boolean }>;
    };
  }
}
