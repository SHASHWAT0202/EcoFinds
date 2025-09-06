// ProductFeed page - Main page showing all products with filtering
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';

import ProductCard from '../components/ProductCard';
import CategoryChips from '../components/CategoryChips';

interface Product {
  id: number;
  title: string;
  price: number;
  location?: string;
  eco_score: number;
  condition_rating: string;
  seller_username: string;
  trust_score: number;
  images?: string[];
  category_name?: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

const ProductFeed = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [condition, setCondition] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, priceRange, condition, page]);

  useEffect(() => {
    fetchCategories();
    
    // Get search query from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      // For now, we'll use static categories. In a real app, you'd fetch from API
      setCategories([
        { id: 1, name: 'Electronics', icon: '📱' },
        { id: 2, name: 'Furniture', icon: '🪑' },
        { id: 3, name: 'Clothing', icon: '👕' },
        { id: 4, name: 'Books', icon: '📚' },
        { id: 5, name: 'Sports', icon: '⚽' },
        { id: 6, name: 'Home & Garden', icon: '🏠' },
        { id: 7, name: 'Vehicles', icon: '🚲' },
        { id: 8, name: 'Art & Crafts', icon: '🎨' },
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (selectedCategory) params.append('category', selectedCategory.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (condition) params.append('condition', condition);
      
      const response = await axios.get(`/api/products?${params}`);
      const newProducts = response.data.products || [];
      
      if (resetPage || page === 1) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setHasMore(newProducts.length === 20);
      
      if (resetPage) {
        setPage(1);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(true);
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchProducts(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setCondition('');
    setPage(1);
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
    fetchProducts(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to EcoFinds
        </h1>
        <p className="text-xl opacity-90">
          Discover sustainable products and give items a second life
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </form>

        {/* Category Chips */}
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>More Filters</span>
          </button>
          
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="input"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input"
              >
                <option value="">Any Condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="btn btn-primary w-full"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <>
          <div className="grid-responsive">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn btn-secondary disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : loading ? (
        /* Loading Skeleton */
        <div className="grid-responsive">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="card">
              <div className="skeleton h-48 mb-4"></div>
              <div className="skeleton h-6 mb-2"></div>
              <div className="skeleton h-4 mb-2"></div>
              <div className="skeleton h-4"></div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or browse different categories
          </p>
          <button
            onClick={clearFilters}
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFeed;
