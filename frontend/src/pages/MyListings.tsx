// My Listings page - Shows user's products
import React from 'react';
import { useTranslation } from 'react-i18next';

const MyListings = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('myListings')}</h1>
        <p className="text-gray-600">Manage your product listings</p>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📦</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No listings yet
        </h3>
        <p className="text-gray-600 mb-4">
          Start selling by adding your first product
        </p>
        <button 
          onClick={() => window.location.href = '/add-product'}
          className="btn btn-primary"
        >
          Add Product
        </button>
      </div>
    </div>
  );
};

export default MyListings;
