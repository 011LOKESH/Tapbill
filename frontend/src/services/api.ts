export const API_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders() {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export interface BillItem {
  _id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ShopDetails {
  shopName: string;
  shopAddress: string;
}

export interface Customer {
  _id: string;
  name: string;
  contact: string;
}

export const api = {
  async getBillItems(): Promise<BillItem[]> {
    const response = await fetch(`${API_URL}/bill-items`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return response.json();
  },

  async addBillItem(name: string, price: number): Promise<BillItem> {
    const response = await fetch(`${API_URL}/bill-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name, price }),
    });
    return response.json();
  },

  async updateBillItemQuantity(id: number, quantity: number): Promise<BillItem> {
    const response = await fetch(`${API_URL}/bill-items/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ quantity }),
    });
    return response.json();
  },

  async deleteBillItem(id: number): Promise<void> {
    await fetch(`${API_URL}/bill-items/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
  },

  async clearBill(): Promise<void> {
    await fetch(`${API_URL}/bill-items`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
  },

  async getShopDetails(): Promise<ShopDetails> {
    const response = await fetch(`${API_URL}/user-details`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return response.json();
  },

  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_URL}/customers`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return response.json();
  },

  async getLastBill(): Promise<any> {
    const response = await fetch(`${API_URL}/last-bill`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return response.json();
  },

  async findItemByBarcode(barcode: string): Promise<any> {
    const response = await fetch(`${API_URL}/menu-items/barcode/${encodeURIComponent(barcode)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`No item found for barcode: ${barcode}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async getItemsWithBarcodes(): Promise<any> {
    const response = await fetch(`${API_URL}/menu-items/with-barcodes`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async addMenuItem(menuItem: any): Promise<any> {
    const response = await fetch(`${API_URL}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(menuItem),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async updateItemBarcode(itemId: string, barcode: string): Promise<any> {
    const response = await fetch(`${API_URL}/menu-items/${itemId}/barcode`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ barcode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
};