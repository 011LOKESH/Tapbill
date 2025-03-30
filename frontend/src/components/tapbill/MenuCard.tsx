import React from "react";
import SearchBar from "./SearchBar";

interface MenuCardProps {
  onSearch?: (query: string) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ onSearch }) => {
  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <div className="z-10 flex w-[855px] max-w-full flex-col items-stretch mr-[23px] pt-1.5 max-md:mr-2.5">
      <div className="text-neutral-500 text-base font-normal mr-[61px] mt-1.5 max-md:mr-2.5">
        MENU CARD
      </div>
      <img
        src="https://cdn.builder.io/api/v1/image/assets/736043f625c3417ea539d1ea386aa2a7/ccda367f431a6f855df4ff60f04d9a75bf40cc93?placeholderIfAbsent=true"
        className="aspect-[0.87] object-contain w-5 z-10 mt-[-23px] ml-4 max-md:ml-2.5"
        alt="Menu icon"
      />
      <SearchBar onSearch={handleSearch} />
    </div>
  );
};

export default MenuCard;
