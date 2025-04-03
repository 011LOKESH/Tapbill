import React from 'react';

interface MenuOverlayProps {
  onClose: () => void;
  currentDateTime: string;
}

const MenuOverlay: React.FC<MenuOverlayProps> = ({ onClose, currentDateTime }) => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={onClose} className="text-lg">✕</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          TapBill
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgba(56,224,120,1)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {currentDateTime}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 bg-white flex-1">
        <button className="flex items-center gap-2">
          <span>🧾</span> Bill
        </button>
        <button className="flex items-center gap-2">
          <span>✏️</span> Edit Bill
        </button>
        <button className="flex items-center gap-2">
          <span>📊</span> Reports
        </button>
        <button className="flex items-center gap-2">
          <span>🖨️</span> Print Settings
        </button>
        <button className="flex items-center gap-2">
          <span>⚙️</span> Settings
        </button>
        <button className="flex items-center gap-2">
          <span>📅</span> Day Summary
        </button>
      </div>
    </div>
  );
};

export default MenuOverlay; 