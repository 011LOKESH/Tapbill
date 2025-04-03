import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setCurrentDateTime(`${year}.${month}.${day} ${hours}:${minutes}`);
    };

    // Update immediately
    updateDateTime();

    // Update every second
    const interval = setInterval(updateDateTime, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const navigateToMenu = () => {
    navigate('/menu'); // Navigate to the MenuPage
  };

  return (
    <div className="flex w-full items-center justify-between px-10 py-2 border-[rgba(229,232,235,1)] border-b max-md:max-w-full max-md:px-5">
      <div className="flex items-center gap-4">
        <button onClick={navigateToMenu} className="text-lg">☰</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          TapBill
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-sm text-[rgba(20,20,20,1)] font-medium">
          Menu
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
    </div>
  );
};

export default Header;
