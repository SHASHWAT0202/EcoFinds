// ProductCard component - Shows product info with eco score and seller trust
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Leaf } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    price: number;
    location?: string;
  eco_score: number;
  // optional camelCase aliases (some backend responses may vary)
  ecoScore?: number;
    condition_rating: string;
  seller_username: string;
  sellerUsername?: string;
  trust_score: number;
  trustScore?: number;
    images?: string[];
    category_name?: string;
    created_at: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useTranslation();

  const getEcoScoreBadge = (score: number) => {
    if (score >= 80) return { color: 'eco-badge-high', label: 'Excellent' };
    if (score >= 60) return { color: 'eco-badge-medium', label: 'Good' };
    return { color: 'eco-badge-low', label: 'Fair' };
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 8) return 'trust-score-high';
    if (score >= 6) return 'trust-score-medium';
    return 'trust-score-low';
  };

  const formatCondition = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  // Defensive access: backend may return either snake_case or camelCase keys
  const ecoScore = typeof product.eco_score !== 'undefined' ? product.eco_score : product.ecoScore || 0;
  const trustScoreValue = typeof product.trust_score !== 'undefined' ? Number(product.trust_score) : Number(product.trustScore || 0);
  const ecoScoreBadge = getEcoScoreBadge(ecoScore);
  const trustScoreColor = getTrustScoreColor(trustScoreValue);
  const imageUrl = product.images && product.images.length > 0 
    ? `http://localhost:3001/uploads/${product.images[0]}`
    : '/placeholder-product.jpg';

  return (
    <Link to={`/products/${product.id}`} className="block">
      <div className="card hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
            }}
          />
          
          {/* Eco Score Badge */}
          <div className="absolute top-2 right-2">
            <div className={`eco-badge ${ecoScoreBadge.color} flex items-center space-x-1`}>
              <Leaf className="h-3 w-3" />
              <span>{product.eco_score}</span>
            </div>
          </div>
          
          {/* Category Badge */}
          {product.category_name && (
            <div className="absolute top-2 left-2">
              <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {product.category_name}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 flex-grow">
            {product.title}
          </h3>

          {/* Price and Condition */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {formatCondition(product.condition_rating)}
            </span>
          </div>

          {/* Location */}
          {product.location && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{product.location}</span>
            </div>
          )}

          {/* Seller Info */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {(product.seller_username || product.sellerUsername || '?').toString().charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 truncate max-w-20">
                {product.seller_username || product.sellerUsername || 'Unknown'}
              </span>
            </div>

            {/* Trust Score */}
            <div className={`trust-score ${trustScoreColor} flex items-center space-x-1`}>
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">
                {trustScoreValue.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Time Posted */}
          <div className="text-xs text-gray-500 mt-2">
            {new Date(product.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
