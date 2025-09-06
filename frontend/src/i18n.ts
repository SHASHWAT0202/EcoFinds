// Internationalization configuration with react-i18next
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Language resources
const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      products: 'Products',
      cart: 'Cart',
      orders: 'Orders',
      profile: 'Profile',
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      
      // Product related
      addProduct: 'Add Product',
      myListings: 'My Listings',
      productDetails: 'Product Details',
      price: 'Price',
      condition: 'Condition',
      ecoScore: 'Eco Score',
      seller: 'Seller',
      category: 'Category',
      description: 'Description',
      
      // Cart & Orders
      addToCart: 'Add to Cart',
      checkout: 'Checkout',
      orderHistory: 'Order History',
      orderDetails: 'Order Details',
      
      // Messages & Offers
      messages: 'Messages',
      makeOffer: 'Make Offer',
      acceptOffer: 'Accept',
      rejectOffer: 'Reject',
      
      // Auth
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      username: 'Username',
      fullName: 'Full Name',
      
      // Eco features
      sustainabilityScore: 'Sustainability Score',
      ecoFriendly: 'Eco Friendly',
      sustainable: 'Sustainable',
      
      // Status
      available: 'Available',
      sold: 'Sold',
      pending: 'Pending',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
    }
  },
  hi: {
    translation: {
      // Navigation (Hindi placeholders - would need proper translation)
      home: 'होम',
      products: 'उत्पाद',
      cart: 'कार्ट',
      orders: 'ऑर्डर',
      profile: 'प्रोफ़ाइल',
      login: 'लॉग इन',
      signup: 'साइन अप',
      logout: 'लॉग आउट',
      
      // Common
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      save: 'सेव करें',
      cancel: 'रद्द करें',
      delete: 'डिलीट',
      edit: 'संपादित करें',
      search: 'खोजें',
      filter: 'फिल्टर',
      
      // Product related
      addProduct: 'उत्पाद जोड़ें',
      myListings: 'मेरी लिस्टिंग',
      productDetails: 'उत्पाद विवरण',
      price: 'कीमत',
      condition: 'स्थिति',
      ecoScore: 'इको स्कोर',
      seller: 'विक्रेता',
      category: 'श्रेणी',
      description: 'विवरण',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;
