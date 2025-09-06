// Orders page - Shows user's order history
import React from 'react';
import { useTranslation } from 'react-i18next';

const Orders = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('orders')}</h1>
        <p className="text-gray-600">View your order history</p>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No orders yet
        </h3>
        <p className="text-gray-600 mb-4">
          Your order history will appear here
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn btn-primary"
        >
          Start Shopping
        </button>
      </div>
    </div>
  );
};

export default Orders;
