// Main App component with routing and authentication context
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Components
import Header from './components/Header';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductFeed from './pages/ProductFeed';
import ProductDetail from './pages/ProductDetail';
import AddProduct from './pages/AddProduct';
import MyListings from './pages/MyListings';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  trustScore: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001';

function App() {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ecofinds_token');
    const savedUser = localStorage.getItem('ecofinds_user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('ecofinds_token');
        localStorage.removeItem('ecofinds_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('ecofinds_token', newToken);
    localStorage.setItem('ecofinds_user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ecofinds_token');
    localStorage.removeItem('ecofinds_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const authValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={
                authValue.isAuthenticated ? <Navigate to="/" replace /> : <Login />
              } />
              <Route path="/signup" element={
                authValue.isAuthenticated ? <Navigate to="/" replace /> : <Signup />
              } />
              
              {/* Public product routes */}
              <Route path="/" element={<ProductFeed />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              
              {/* Protected routes */}
              <Route path="/add-product" element={
                authValue.isAuthenticated ? <AddProduct /> : <Navigate to="/login" />
              } />
              <Route path="/my-listings" element={
                authValue.isAuthenticated ? <MyListings /> : <Navigate to="/login" />
              } />
              <Route path="/cart" element={
                authValue.isAuthenticated ? <Cart /> : <Navigate to="/login" />
              } />
              <Route path="/orders" element={
                authValue.isAuthenticated ? <Orders /> : <Navigate to="/login" />
              } />
              <Route path="/profile" element={
                authValue.isAuthenticated ? <Profile /> : <Navigate to="/login" />
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Language selector (floating) */}
          <div className="fixed bottom-4 right-4">
            <select 
              value={i18n.language} 
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
