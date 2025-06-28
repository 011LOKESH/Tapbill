import React from 'react';
import { BillItem } from '@/services/api';

interface BillDisplayProps {
  items: BillItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onDeleteItem: (id: number) => void;
  onClearBill: () => void;
}

const BillDisplay: React.FC<BillDisplayProps> = ({
  items,
  onUpdateQuantity,
  onDeleteItem,
  onClearBill,
}) => {
  return (
    <div>
    </div>
  );
};

export default BillDisplay;
