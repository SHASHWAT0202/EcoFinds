// Product Detail page - Shows detailed product information
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';
import { 
  MapPin, 
  Star, 
  Leaf, 
  ShoppingCart, 
  MessageCircle, 
  DollarSign,
  Calendar,
  Package,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  location?: string;
  eco_score: number;
  condition_rating: string;
  year_of_manufacture?: number;
  seller_username: string;
  seller_name?: string;
  trust_score: number;
  images?: string[];
  category_name?: string;
  created_at: string;
  is_available: boolean;
}

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (quantity = 1) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return false;
    }

    if (!product?.id) return false;

    try {
      setAddingToCart(true);
      await axios.post('/api/cart', { productId: product.id, quantity });
      // Optionally update a local cart state or emit an event
      alert('Added to cart successfully!');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const buyNow = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (!product?.id) return;

    // Simple shipping address prompt for the mock checkout flow.
    const shippingAddress = window.prompt('Enter shipping address for this order:');
    if (!shippingAddress) {
      return;
    }

    try {
      setProcessingOrder(true);

      // Ensure product is in cart, then create order from cart on backend
      const added = await addToCart(1);
      if (!added) {
        throw new Error('Failed to add product to cart');
      }

      const resp = await axios.post('/api/orders', { shippingAddress });
      const orderId = resp.data?.orderId;

      alert(`Order placed successfully${orderId ? ' (Order #' + orderId + ')' : ''}`);
      // Redirect to orders page to view order
      window.location.href = '/orders';
    } catch (err) {
      console.error('Buy now error:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="skeleton h-96"></div>
          <div className="space-y-4">
            <div className="skeleton h-8"></div>
            <div className="skeleton h-4"></div>
            <div className="skeleton h-6"></div>
            <div className="skeleton h-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </div>
    );
  }

  const ecoScoreValue = typeof product.eco_score !== 'undefined' ? product.eco_score : (product as any).ecoScore || 0;
  const trustScoreValue = typeof product.trust_score !== 'undefined' ? Number(product.trust_score) : Number((product as any).trustScore || 0);
  const images = Array.isArray(product.images) ? product.images : [];
  const sellerId = (product as any).seller_id ?? (product as any).sellerId ?? null;
  const currentImage = images.length > 0 
    ? `http://localhost:3001/uploads/${images[currentImageIndex]}`
    : '/placeholder-product.jpg';
  const ecoScoreBadge = getEcoScoreBadge(ecoScoreValue);
  const trustScoreColor = getTrustScoreColor(trustScoreValue);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={currentImage}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
              }}
            />
            
            {/* Eco Score Badge */}
            <div className="absolute top-4 right-4">
              <div className={`eco-badge ${ecoScoreBadge.color} flex items-center space-x-1`}>
                <Leaf className="h-4 w-4" />
                <span>{product.eco_score}</span>
              </div>
            </div>
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    currentImageIndex === index ? 'border-primary-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={`http://localhost:3001/uploads/${image}`}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-primary-600">
                ${product.price.toFixed(2)}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {product.condition_rating.charAt(0).toUpperCase() + product.condition_rating.slice(1)}
              </span>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {(product.seller_username || (product as any).sellerUsername || '?').toString().charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.seller_username || (product as any).sellerUsername || 'Unknown'}</p>
                <div className={`trust-score ${trustScoreColor} flex items-center space-x-1`}>
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm">{trustScoreValue.toFixed(1)} Trust Score</span>
                </div>
              </div>
            </div>
            
            {isAuthenticated && user?.id !== (product as any).seller_id && (
              <button className="btn btn-secondary text-sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </button>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {product.location && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{product.location}</span>
              </div>
            )}
            
            {product.year_of_manufacture && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>Year: {product.year_of_manufacture}</span>
              </div>
            )}
            
            {product.category_name && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Package className="h-5 w-5" />
                <span>Category: {product.category_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Actions */}
          {(product.is_available ?? true) ? (
            <div className="space-y-3">
              <button
                onClick={() => addToCart()}
                disabled={addingToCart || processingOrder}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>

              <button
                onClick={buyNow}
                disabled={processingOrder || addingToCart}
                className="w-full btn btn-accent flex items-center justify-center"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                {processingOrder ? 'Processing...' : 'Buy Now'}
              </button>

              <button
                onClick={() => setShowOfferModal(true)}
                className="w-full btn btn-secondary flex items-center justify-center"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Make Offer
              </button>

              {!isAuthenticated && (
                <div className="text-center text-sm text-gray-600 pt-2">
                  Sign in to complete checkout or message the seller.
                </div>
              )}

              {isAuthenticated && user?.id === sellerId && (
                <div className="text-center text-sm text-yellow-600 pt-2">
                  Note: You are viewing your own listing — purchases will not succeed for your own product.
                </div>
              )}
            </div>
          ) : !product.is_available ? (
            <div className="text-center py-4">
              <span className="text-red-600 font-medium">This item is no longer available</span>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Sign in to purchase this item</p>
              <Link to="/login" className="btn btn-primary">
                Sign In
              </Link>
            </div>
          ) : null}

          {/* Posted Date */}
          <div className="text-sm text-gray-500 pt-4 border-t">
            Posted on {new Date(product.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
