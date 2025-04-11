import React from 'react';

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any; // Adjust type as needed
}

const BillDetailsModal: React.FC<BillDetailsModalProps> = ({ isOpen, onClose, bill }) => {
  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold text-green-600">Bill Details</h3>
        <ul className="mt-4">
          {bill.items.map((item: any) => (
            <li key={item._id} className="flex justify-between">
              <span>{item.name} - Quantity: {item.quantity}</span>
              <span>₹{item.total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <h4 className="mt-4 font-bold text-green-600">Total Amount: ₹{bill.total.toFixed(2)}</h4>
        <button onClick={onClose} className="mt-4 bg-green-600 text-white py-2 px-4 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default BillDetailsModal; 