const API_URL = 'http://localhost:5000/api';

export interface BillItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export const api = {
  async getBillItems(): Promise<BillItem[]> {
    const response = await fetch(`${API_URL}/bill-items`);
    return response.json();
  },

  async addBillItem(name: string, price: number): Promise<BillItem> {
    const response = await fetch(`${API_URL}/bill-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, price }),
    });
    return response.json();
  },

  async updateBillItemQuantity(id: string, quantity: number): Promise<BillItem> {
    const response = await fetch(`${API_URL}/bill-items/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });
    return response.json();
  },

  async deleteBillItem(id: string): Promise<void> {
    await fetch(`${API_URL}/bill-items/${id}`, {
      method: 'DELETE',
    });
  },

  async clearBill(): Promise<void> {
    await fetch(`${API_URL}/bill-items`, {
      method: 'DELETE',
    });
  },
}; 