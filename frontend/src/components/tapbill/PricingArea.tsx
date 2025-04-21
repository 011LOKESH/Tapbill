import React from "react";

interface BillItem {
  _id: string | number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface PricingAreaProps {
  items: BillItem[];
  onUpdateQuantity: (id: string | number, quantity: number) => void;
  onDeleteItem: (id: string | number) => void;
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
      <div className="grid grid-cols-[2fr,1fr,1fr,1fr,0.5fr] gap-4 mb-4 font-bold text-gray-700">
        <div>Item</div>
        <div className="text-center">Qty</div>
        <div className="text-center">Price</div>
        <div className="text-center">Total</div>
        <div></div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item._id} className="grid grid-cols-[2fr,1fr,1fr,1fr,0.5fr] gap-4 py-2 border-b border-gray-100 items-center">
            <div className="font-medium truncate pr-2">{item.name}</div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
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
            <div className="text-center">₹{item.price.toFixed(2)}</div>
            <div className="text-center">₹{(item.price * item.quantity).toFixed(2)}</div>
            <div className="flex justify-center">
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
      
      <div className="flex justify-between font-bold text-lg mt-4">
        <div>Net Total:</div>
        <div>₹{calculateTotal().toFixed(2)}</div>
      </div>
    </div>
  );
};

export default PricingArea; 