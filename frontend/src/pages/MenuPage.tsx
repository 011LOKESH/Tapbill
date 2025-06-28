import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // Import format for date display

// SVG Icons (reuse from previous version)
const BillIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[rgb(56,224,120)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[rgb(56,224,120)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[rgb(56,224,120)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[rgb(56,224,120)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[rgb(56,224,120)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CustomizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 16v-2m8-8h2M4 12H2m16.938 4.938l1.414 1.414M4.646 4.646l1.414 1.414M19.354 4.646l-1.414 1.414M4.646 19.354l1.414-1.414" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const SummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[rgb(56,224,120)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSettingsOptions, setShowSettingsOptions] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleSettingsOptions = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowSettingsOptions(!showSettingsOptions);
  };

  // Component for each menu item card
  const MenuCard: React.FC<{ icon: React.ReactNode; label: string; path?: string; onClick?: (e: React.MouseEvent) => void; children?: React.ReactNode; isSettingsToggle?: boolean; isOpen?: boolean }> = 
    ({ icon, label, path, onClick, children, isSettingsToggle, isOpen }) => {
      const cardClasses = "flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer text-center";
      const content = (
          <>
            {icon}
            <span className="text-md font-semibold text-gray-700 mt-2 flex items-center">
              {label}
              {isSettingsToggle && (
                <span className={`ml-1 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <ChevronDownIcon />
                </span>
              )}
            </span>
          </>
      );

      if (path) {
        return (
          <div onClick={() => handleNavigation(path)} className={cardClasses}>
            {content}
          </div>
        );
      } else if (onClick) {
        return (
          <div onClick={onClick} className={cardClasses}>
            {content}
          </div>
        );
      }
      return <div className={cardClasses + " cursor-default"}>{content}</div>; // Fallback if no action
  };
  
  // Component for sub-menu items (used within Settings)
  const SubMenuItem: React.FC<{ icon: React.ReactNode; label: string; path: string }> = 
    ({ icon, label, path }) => {
    return (
      <button 
        onClick={() => handleNavigation(path)} 
        className="flex items-center w-full px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-150">
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Matches other pages */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)] bg-white">
        {/* Optional: Add a logo or different element if needed for the main menu */}
        {/* <button onClick={() => console.log('Menu Button')} className="text-lg bg-[#F5F5F5] w-8 h-8 flex items-center justify-center rounded-lg">☰</button> */} 
        <div className="flex-1"></div> {/* Spacer */} 
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          TapBill Menu
        </div>
        <div className="flex flex-1 justify-end gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium text-white">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {format(new Date(), "d/M/yyyy, h:mm:ss a")} {/* Use consistent date format */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Grid layout for menu cards */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          
          <MenuCard icon={<BillIcon />} label="Billing" path="/billing" />
          <MenuCard icon={<EditIcon />} label="Edit Bill" path="/edit-bill" />
          <MenuCard icon={<ReportIcon />} label="Reports" path="/report" />
          <MenuCard icon={<PrintIcon />} label="Print Settings" path="/print-settings" />
          <MenuCard icon={<SummaryIcon />} label="Day Summary" path="/day-summary" />

          {/* Settings Card with Dropdown Logic */}
          <div className="col-span-1">
            <MenuCard 
              icon={<SettingsIcon />} 
              label="Settings" 
              onClick={toggleSettingsOptions} 
              isSettingsToggle={true} 
              isOpen={showSettingsOptions}
            />
            {/* Render sub-items below the card when open */}
            {showSettingsOptions && (
              <div className="mt-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200 space-y-2">
                <SubMenuItem icon={<CustomizeIcon />} label="Customize Menu" path="/customize-menu" />
                <SubMenuItem icon={<ExportIcon />} label="Export & Delete" path="/export-and-delete" />
              </div>
            )}
          </div>

          {/* Add more cards here if needed */}

        </div>
      </main>
    </div>
  );
};

export default MenuPage; 