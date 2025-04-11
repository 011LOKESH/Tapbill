import React from 'react';
import { BillItem } from '@/services/api';

interface BillDisplayProps {
  items: BillItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDeleteItem: (id: string) => void;
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
