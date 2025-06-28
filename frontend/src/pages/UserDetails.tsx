import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';

const VERSION = '1.0';

const UserDetails: React.FC = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState('');
  const [userDetails, setUserDetails] = useState({
    username: '',
    phone: '',
    shopName: '',
    shopAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Update date/time every second
    const interval = setInterval(() => {
      const now = new Date();
      setDateTime(
        `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ` +
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch user details from backend
    setLoading(true);
    fetch(`${API_URL}/user-details`, {
      headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userSession') || 'null')?.token || ''}` }
    })
      .then(res => res.json())
      .then(data => {
        setUserDetails(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    await fetch(`${API_URL}/user-details`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userSession') || 'null')?.token || ''}`
      },
      body: JSON.stringify(userDetails)
    });
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-2 border-b border-[rgba(229,232,235,1)] bg-white">
        <button onClick={() => navigate(-1)} className="text-lg font-bold text-gray-700">&#8592;</button>
        <div className="text-lg text-[rgba(20,20,20,1)] font-bold whitespace-nowrap leading-none">User Details</div>
        <div className="flex gap-2">
          <div className="bg-[rgb(56,224,120)] flex min-w-[84px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">Version {VERSION}</div>
          </div>
          <div className="bg-neutral-100 flex min-w-[120px] h-8 items-center justify-center px-4 rounded-[20px]">
            <div className="text-sm font-medium">{dateTime}</div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col items-center justify-start flex-1 p-6 overflow-auto">
        {/* Admin Details */}
        <div className="w-full max-w-xl bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-lg font-semibold mb-4 border-b pb-2">Admin Details</div>
          <div className="mb-2"><span className="font-medium">Admin name:</span> Lokesh R</div>
          <div><span className="font-medium">Contact number:</span> 9566645566</div>
        </div>
        {/* User Details */}
        <div className="w-full max-w-xl bg-white rounded-lg shadow p-6">
          <div className="text-lg font-semibold mb-4 border-b pb-2">User Details</div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">User name</label>
            <input type="text" name="username" value={userDetails.username} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Ph.no</label>
            <input type="text" name="phone" value={userDetails.phone} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Shop name</label>
            <input type="text" name="shopName" value={userDetails.shopName} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Shop Address</label>
            <input type="text" name="shopAddress" value={userDetails.shopAddress} onChange={handleChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <button onClick={handleSave} disabled={loading} className="w-full bg-green-400 hover:bg-green-500 text-white font-bold py-2 rounded transition-all duration-200">
            {loading ? 'Saving...' : 'Save'}
          </button>
          {success && <div className="text-green-600 mt-2 text-center">Details updated successfully!</div>}
        </div>
      </div>
    </div>
  );
};

export default UserDetails; 