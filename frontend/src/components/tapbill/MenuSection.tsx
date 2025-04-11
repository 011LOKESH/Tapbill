import React from 'react';

interface MenuSectionProps {
  onItemClick: (name: string, price: number) => void;
}

const MenuSection: React.FC<MenuSectionProps> = ({ onItemClick }) => {
  return (
    <div>
    </div>
  );
};

export default MenuSection;
