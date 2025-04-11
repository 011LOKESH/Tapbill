import React, { useState } from 'react';

interface DateFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilter: (startDate: Date, endDate: Date) => void;
}

const DateFilterModal: React.FC<DateFilterModalProps> = ({ isOpen, onClose, onFilter }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleFilter = () => {
    if (startDate && endDate) {
      onFilter(new Date(startDate), new Date(endDate));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold">Filter by Date</h3>
        <div className="mt-4">
          <label className="block mb-2">Start Date & Time:</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border h-10 px-2 rounded"
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2">End Date & Time:</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border h-10 px-2 rounded"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleFilter} className="bg-green-600 text-white py-2 px-4 rounded mr-2">
            Search
          </button>
          <button onClick={onClose} className="bg-gray-300 py-2 px-4 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateFilterModal; 