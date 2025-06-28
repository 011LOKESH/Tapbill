import { api } from './api';

export interface BarcodeMenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  barcode: string;
  isVeg: boolean;
  isAvailable: boolean;
}

export interface BarcodeLookupResult {
  success: boolean;
  item?: BarcodeMenuItem;
  message: string;
  barcode?: string;
}

export class BarcodeService {
  // Find menu item by barcode
  static async findItemByBarcode(barcode: string): Promise<BarcodeLookupResult> {
    try {
      console.log('Looking up barcode:', barcode);
      
      if (!barcode || barcode.trim().length < 3) {
        return {
          success: false,
          message: 'Barcode must be at least 3 characters long'
        };
      }

      // Use the proper API method
      const data = await api.findItemByBarcode(barcode.trim());
      console.log('Barcode lookup response:', data);

      return {
        success: true,
        item: data.item,
        message: data.message
      };
    } catch (error: any) {
      console.error('Barcode lookup error:', error);

      return {
        success: false,
        message: `Error looking up barcode: ${error.message}`,
        barcode: barcode
      };
    }
  }

  // Update barcode for menu item
  static async updateItemBarcode(itemId: string, barcode: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await api.updateItemBarcode(itemId, barcode);
      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error updating barcode:', error);
      return {
        success: false,
        message: error.message || 'Error updating barcode'
      };
    }
  }

  // Get all items with barcodes
  static async getItemsWithBarcodes(): Promise<BarcodeMenuItem[]> {
    try {
      const data = await api.getItemsWithBarcodes();
      return data;
    } catch (error) {
      console.error('Error fetching items with barcodes:', error);
      return [];
    }
  }

  // Validate barcode format (basic validation)
  static validateBarcode(barcode: string): { valid: boolean; message: string } {
    if (!barcode || barcode.trim().length === 0) {
      return { valid: false, message: 'Barcode cannot be empty' };
    }

    const trimmedBarcode = barcode.trim();
    
    if (trimmedBarcode.length < 3) {
      return { valid: false, message: 'Barcode must be at least 3 characters long' };
    }

    if (trimmedBarcode.length > 50) {
      return { valid: false, message: 'Barcode cannot exceed 50 characters' };
    }

    // Check for valid characters (alphanumeric and some special chars)
    const validPattern = /^[A-Za-z0-9\-_\.]+$/;
    if (!validPattern.test(trimmedBarcode)) {
      return { valid: false, message: 'Barcode contains invalid characters' };
    }

    return { valid: true, message: 'Valid barcode' };
  }

  // Generate a simple barcode (for demo purposes)
  static generateBarcode(prefix: string = 'TB'): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Test barcode format (like the provided 8901396476009)
  static isEANBarcode(barcode: string): boolean {
    // Check if it's a valid EAN-13 barcode format (13 digits)
    return /^\d{13}$/.test(barcode);
  }

  // Test the provided barcode
  static testProvidedBarcode(): void {
    const testBarcode = '8901396476009';
    console.log('Testing provided barcode:', testBarcode);
    console.log('Is valid EAN-13:', this.isEANBarcode(testBarcode));
    console.log('Validation result:', this.validateBarcode(testBarcode));
  }
}

export default BarcodeService;
