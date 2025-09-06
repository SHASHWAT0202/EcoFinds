// SellerCard component - Shows seller information
import React from 'react';
import { Star } from 'lucide-react';

interface SellerCardProps {
  seller: {
    username: string;
    fullName?: string;
    trustScore: number;
    profileImage?: string;
  };
}

const SellerCard: React.FC<SellerCardProps> = ({ seller }) => {
  const getTrustScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
        <span className="text-white font-medium">
          {seller.username.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {seller.fullName || seller.username}
        </p>
        <div className={`flex items-center space-x-1 ${getTrustScoreColor(seller.trustScore)}`}>
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm">{seller.trustScore.toFixed(1)} Trust Score</span>
        </div>
      </div>
    </div>
  );
};

export default SellerCard;
