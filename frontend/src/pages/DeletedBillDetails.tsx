import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BillItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface DeletedBillData {
  id: string;
  billNo: string;
  dateTime: string;
  paymentMode: string;
  tax: number;
  qty: number;
  netAmount: number;
  deletedAt: string;
  items: BillItem[];
}

const DeletedBillDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bill } = location.state as { bill: DeletedBillData };

  const handleBack = () => {
    navigate('/deleted-bills');
  };

  if (!bill) {
    return <div>Bill not found</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={handleBack} className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg">←</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Deleted Bill Details
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

      {/* Main Content */}
      <div className="flex-1 px-8 py-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
          {/* Bill Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Bill No: {bill.billNo}</h2>
              <p className="text-gray-600">Date: {new Date(bill.dateTime).toLocaleString()}</p>
              <p className="text-gray-600">Deleted At: {new Date(bill.deletedAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Payment Mode: {bill.paymentMode}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-center">Quantity</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Tax (10%):</span>
              <span>₹{bill.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span>₹{bill.netAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletedBillDetails; 