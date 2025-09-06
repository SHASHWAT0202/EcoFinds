// Profile page - User profile management
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile')}</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* User Info Card */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.fullName || user?.username}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-500">Trust Score:</span>
              <span className="text-sm font-medium text-green-600">
                {user?.trustScore?.toFixed(1) || '5.0'}/10
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">0</div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Completed Sales</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => window.location.href = '/my-listings'}
          className="card text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📦</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">My Listings</h3>
              <p className="text-sm text-gray-600">Manage your products</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/orders'}
          className="card text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">📋</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Order History</h3>
              <p className="text-sm text-gray-600">View past orders</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/add-product'}
          className="card text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">➕</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Add Product</h3>
              <p className="text-sm text-gray-600">List a new item</p>
            </div>
          </div>
        </button>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">⚙️</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600">Account preferences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
