import React from "react";
import { BillItem } from '@/services/api';

interface PricingAreaProps {
  items: BillItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDeleteItem: (id: string) => void;
}

const PricingArea: React.FC<PricingAreaProps> = ({
  items,
  onUpdateQuantity,
  onDeleteItem,
}) => {
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4">
      <div className="grid grid-cols-5 gap-4 mb-4 font-bold text-gray-700">
        <div>Item</div>
        <div>Qty</div>
        <div>Price</div>
        <div>Total</div>
        <div></div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item._id} className="grid grid-cols-5 gap-4 py-2 border-b border-gray-100 items-center">
            <div>{item.name}</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item._id, Math.max(0, item.quantity - 1))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center"
              >
                -
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div>₹{item.price}</div>
            <div>₹{item.price * item.quantity}</div>
            <div>
              <button
                onClick={() => onDeleteItem(item._id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between font-bold text-lg">
          <div>Net Total:</div>
          <div>₹{calculateTotal()}</div>
        </div>
      </div>
    </div>
  );
};

export default PricingArea; 