import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from '../services/api';

interface Customer {
  _id: string;
  name: string;
  contact: string;
  createdAt: string;
}

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('userSession') || 'null')?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CustomerDetails: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", contact: "" });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`, {
        headers: getAuthHeaders(),
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    if (newCustomer.name && newCustomer.contact) {
      try {
        console.log('Saving customer:', newCustomer);
        const response = await axios.post(`${API_URL}/customers`, newCustomer, {
          headers: getAuthHeaders(),
        });
        console.log('Save response:', response.data);
        setNewCustomer({ name: "", contact: "" });
        fetchCustomers();
      } catch (error) {
        console.error('Error saving customer:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error response:', error.response?.data);
        }
      }
    } else {
      console.log('Please fill in all fields');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (editingCustomer) {
      try {
        await axios.patch(`${API_URL}/customers/${editingCustomer._id}`, editingCustomer, {
          headers: getAuthHeaders(),
        });
        setShowEditModal(false);
        setEditingCustomer(null);
        fetchCustomers();
      } catch (error) {
        console.error('Error updating customer:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_URL}/customers/${id}`, {
          headers: getAuthHeaders(),
        });
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = customers.filter(
    customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Customer Details</h1>
        <div className="text-right">
          <div className="text-sm font-medium">Version 1.0</div>
          <div className="text-xs text-gray-500">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="p-4 flex gap-4">
        {/* Left Section - Customer List */}
        <div className="flex-1 bg-white rounded-xl shadow p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            {filteredCustomers.map(customer => (
              <div 
                key={customer._id}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.contact}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Add Customer Form */}
        <div className="w-80 bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-bold mb-4">Add New Customer</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full bg-gray-100 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number</label>
              <input
                type="tel"
                value={newCustomer.contact}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                className="w-full bg-gray-100 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] focus:outline-none focus:ring-2 focus:ring-[rgba(56,224,120,1)] focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setNewCustomer({ name: "", contact: "" })}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 px-4 bg-[rgb(56,224,120)] text-black font-medium rounded-xl hover:bg-[rgb(46,204,110)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Edit Customer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full bg-gray-100 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] focus:outline-none focus:ring-2 focus:ring-[rgb(56,224,120)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={editingCustomer.contact}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, contact: e.target.value })}
                  className="w-full bg-gray-100 border h-10 px-4 rounded-xl border-[rgba(224,224,224,1)] focus:outline-none focus:ring-2 focus:ring-[rgb(56,224,120)] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 px-4 bg-[rgb(56,224,120)] text-black font-medium rounded-xl hover:bg-[rgb(46,204,110)] transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails; 