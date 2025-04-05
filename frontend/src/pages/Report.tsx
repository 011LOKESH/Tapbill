import React from 'react';
import { useNavigate } from 'react-router-dom';

const Report: React.FC = () => {
  const navigate = useNavigate();

  const navigateToMenu = () => {
    navigate('/menu');
  };

  const handleCategoryClick = (category: string) => {
    switch (category) {
      case 'day-summary':
        navigate('/day-wise-sales');
        break;
      case 'bill-sales':
        navigate('/bill-wise-sales');
        break;
      case 'deleted-items':
        // Handle deleted items navigation
        break;
      case 'deleted-bill':
        // Handle deleted bill navigation
        break;
      case 'day-sales':
        // Handle day sales print
        break;
      case 'bill-sales-print':
        // Handle bill sales print navigation
        break;
      case 'user-report':
        // Handle user report navigation
        break;
      default:
        console.log(`Clicked on ${category}`);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)]">
        <button onClick={navigateToMenu} className="text-lg">☰</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">
          Report
        </div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              Version 1.0
            </div>
          </div>
          <div className="bg-neutral-100 flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Categories</h1>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Daily Update Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">Daily Update</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('day-summary')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Day Summary</h3>
                  <p className="text-sm text-gray-600">A brief breakdown of daily transactions.</p>
                </div>
                <div onClick={() => handleCategoryClick('bill-sales')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Bill Sales</h3>
                  <p className="text-sm text-gray-600">Analyze bill trends and patterns.</p>
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">Product Details</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('deleted-items')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Deleted Items</h3>
                  <p className="text-sm text-gray-600">Overview of removed products from the inventory.</p>
                </div>
                <div onClick={() => handleCategoryClick('deleted-bill')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Deleted Bill</h3>
                  <p className="text-sm text-gray-600">Details of bills that have been deleted.</p>
                </div>
              </div>
            </div>

            {/* Print Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">Print</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('day-sales')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Day Sales</h3>
                  <p className="text-sm text-gray-600">Summary of total sales and transactions completed during the day.</p>
                </div>
                <div onClick={() => handleCategoryClick('bill-sales-print')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">Bill Sales</h3>
                  <p className="text-sm text-gray-600">Overview of individual bills with details of amounts and payment modes.</p>
                </div>
              </div>
            </div>

            {/* User Details Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold mb-2">User Details</h2>
              <div className="space-y-4">
                <div onClick={() => handleCategoryClick('user-report')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <h3 className="font-medium">User Report</h3>
                  <p className="text-sm text-gray-600">Analytics on user behavior and engagement.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report; 