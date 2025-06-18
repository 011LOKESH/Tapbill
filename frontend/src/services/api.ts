const API_URL = 'http://localhost:5000/api';

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
}; 