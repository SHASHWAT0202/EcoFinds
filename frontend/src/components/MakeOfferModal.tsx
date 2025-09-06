// MakeOfferModal component - Modal for making offers on products
import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productTitle: string;
  originalPrice: number;
  onOfferSubmitted?: () => void;
}

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  originalPrice,
  onOfferSubmitted
}) => {
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Submit offer to API
    console.log('Submitting offer:', {
      productId,
      offeredPrice: parseFloat(offeredPrice),
      message
    });

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onOfferSubmitted?.();
      onClose();
      alert('Offer submitted successfully!');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Make an Offer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{productTitle}</h3>
            <p className="text-sm text-gray-600">
              Original Price: <span className="font-medium">${originalPrice.toFixed(2)}</span>
            </p>
          </div>

          {/* Offer Amount */}
          <div>
            <label htmlFor="offeredPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Your Offer Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="number"
                id="offeredPrice"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                className="input pl-10"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input"
              rows={3}
              placeholder="Add a message to the seller..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !offeredPrice}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeOfferModal;
