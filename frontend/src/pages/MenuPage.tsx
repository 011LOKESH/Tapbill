import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSettingsOptions, setShowSettingsOptions] = useState(false); // State to manage dropdown visibility

  const handleOptionClick = (option: string) => {
    if (option === 'Bill') {
      navigate('/'); // Navigate to the home page
    } else if (option === 'Edit Bill') {
      navigate('/edit-bill'); // Navigate to the EditBill page
    } else if (option === 'Reports') {
      navigate('/report');
    } else if (option === 'Customize Menu') {
      navigate('/customize-menu');
<<<<<<< HEAD
    } else if (option === 'Export & Delete') {
      navigate('/export-and-delete');
=======
>>>>>>> 9d342797ea0070b4c44e755054df366becbdb4bc
    }
    // Handle other options...
  };

  const toggleSettingsOptions = () => {
    setShowSettingsOptions(!showSettingsOptions); // Toggle dropdown visibility
  };

  const navigateToHome = () => {
    navigate('/'); // Navigate back to the home page
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToHome} className="text-lg">☰</button> {/* Hamburger button */}
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
              {new Date().toLocaleString()} {/* Display current date and time */}
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-full">
        <div className="w-1/4 bg-gray-100 p-4">
          <ul className="mt-4">
            <li onClick={() => handleOptionClick('Bill')} className="cursor-pointer font-bold">🧾 Bill</li>
            <li onClick={() => handleOptionClick('Edit Bill')} className="cursor-pointer font-bold">✏️ Edit Bill</li>
            <li onClick={() => handleOptionClick('Reports')} className="cursor-pointer font-bold">📊 Reports</li>
            <li onClick={() => handleOptionClick('Print Settings')} className="cursor-pointer font-bold">🖨️ Print Settings</li>
            <li onClick={toggleSettingsOptions} className="cursor-pointer flex justify-between items-center font-bold">
              <span>⚙️ Settings</span>
              <span className={`transform transition-transform ${showSettingsOptions ? 'rotate-180' : ''}`}>▼</span> {/* Down arrow */}
            </li>
            {showSettingsOptions && (
              <div className="ml-4">
                <li onClick={() => handleOptionClick('Customize Menu')} className="cursor-pointer font-bold">🛠️ Customize Menu</li>
<<<<<<< HEAD
                <li onClick={() => handleOptionClick('Export & Delete')} className="cursor-pointer font-bold">📤 Export & Delete</li>
=======
                <li onClick={() => handleOptionClick('Export & Delete')} className="cursor-pointer font-bold">📤 Delete & Export</li>
>>>>>>> 9d342797ea0070b4c44e755054df366becbdb4bc
              </div>
            )}
            <li onClick={() => handleOptionClick('Day Summary')} className="cursor-pointer font-bold">📅 Day Summary</li>
          </ul>
        </div>
        <div className="flex-1 p-4 bg-transparent">
          {/* You can add more content here if needed */}
        </div>
      </div>
    </div>
  );
};

export default MenuPage; 