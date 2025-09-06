// Cart page - Shows user's cart items
import React from 'react';
import { useTranslation } from 'react-i18next';

const Cart = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('cart')}</h1>
        <p className="text-gray-600">Review your selected items</p>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">🛒</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-gray-600 mb-4">
          Browse products and add them to your cart
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn btn-primary"
        >
          Browse Products
        </button>
      </div>
    </div>
  );
};

export default Cart;
