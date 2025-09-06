# EcoFinds - Sustainable Marketplace

A full-stack web application for buying and selling sustainable products with eco-scoring, built with Node.js, Express, React, TypeScript, and MySQL.

## Features

- **User Authentication**: Secure signup/login with JWT tokens
- **Product Management**: Create, read, update, delete products with image uploads
- **Eco Scoring**: Automatic sustainability scoring based on product attributes
- **Shopping Cart**: Add products to cart and checkout functionality
- **Order Management**: Place orders with QR code generation
- **Offers System**: Make and manage price negotiations
- **Messaging**: Real-time chat between buyers and sellers
- **Notifications**: System notifications for important events
- **Trust Scores**: Seller reputation system
- **Internationalization**: English and Hindi language support
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL with mysql2/promise
- JWT authentication
- bcrypt for password hashing
- Multer for file uploads
- QR code generation
- Email notifications (Nodemailer)

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React i18next for internationalization
- Lucide React for icons

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EcoFinds
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=ecofinds
# JWT_SECRET=your_very_long_and_secure_jwt_secret
```

### 3. Database Setup

#### Option 1: MySQL Workbench (Recommended)
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open the file `backend/db/schema.sql`
4. Execute the entire script to create the database and tables
5. Verify the `ecofinds` database was created with all tables

#### Option 2: MySQL Command Line
```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source /path/to/EcoFinds/backend/db/schema.sql

# Verify database creation
USE ecofinds;
SHOW TABLES;
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### 5. Running the Application

#### Start Backend Server
```bash
# From backend directory
cd backend
npm run dev
# Server will start on http://localhost:3001
```

#### Start Frontend Development Server
```bash
# From frontend directory (in another terminal)
cd frontend
npm run dev
# Frontend will start on http://localhost:3000
```

### 6. Testing the Application

1. **Database Connection**: Backend should log "✅ Connected to MySQL database" on startup
2. **API Health Check**: Visit http://localhost:3001/api/health
3. **Frontend**: Visit http://localhost:3000 to see the application
4. **User Registration**: Create a new account via the signup form
5. **Product Listing**: Add a test product to verify file upload works

## Directory Structure

```
EcoFinds/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env.example          # Environment variables template
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── products.js       # Product CRUD operations
│   │   ├── cart.js           # Shopping cart management
│   │   ├── orders.js         # Order processing
│   │   ├── offers.js         # Price negotiations
│   │   ├── messages.js       # User messaging
│   │   └── notifications.js  # System notifications
│   ├── middleware/
│   │   └── authMiddleware.js # JWT authentication middleware
│   ├── db/
│   │   └── schema.sql        # Database schema and seed data
│   └── uploads/              # Product image storage
│
└── frontend/
    ├── package.json          # Frontend dependencies
    ├── vite.config.ts        # Vite configuration
    ├── tailwind.config.cjs   # Tailwind CSS configuration
    ├── src/
    │   ├── main.tsx          # React entry point
    │   ├── App.tsx           # Main app component with routing
    │   ├── i18n.ts           # Internationalization setup
    │   ├── pages/            # Page components
    │   │   ├── Login.tsx
    │   │   ├── Signup.tsx
    │   │   ├── ProductFeed.tsx
    │   │   ├── ProductDetail.tsx
    │   │   ├── AddProduct.tsx
    │   │   ├── MyListings.tsx
    │   │   ├── Cart.tsx
    │   │   ├── Orders.tsx
    │   │   └── Profile.tsx
    │   └── components/       # Reusable components
    │       ├── Header.tsx
    │       ├── ProductCard.tsx
    │       ├── SellerCard.tsx
    │       ├── MakeOfferModal.tsx
    │       ├── ChatBox.tsx
    │       └── CategoryChips.tsx
    └── public/
        └── locales/          # Translation files
            ├── en/translation.json
            └── hi/translation.json
```

## Key Features Implementation

### Eco Score Calculation
Products automatically receive an eco score (0-100) based on:
- **Age**: Newer items score higher for reusability
- **Condition**: Better condition = higher score
- **Category**: Some categories have higher sustainability value

### Trust Score System
Users have trust scores (0-10) that increase with:
- Successful transactions
- Positive reviews
- Account verification
- Time on platform

### Security Features
- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens for authentication
- Parameterized SQL queries to prevent injection
- File upload restrictions (images only, 5MB limit)
- CORS protection

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products (with filtering)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (requires auth)
- `PUT /api/products/:id` - Update product (owner only)
- `DELETE /api/products/:id` - Delete product (owner only)

### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user's orders

### Offers & Messages
- `POST /api/offers` - Make price offer
- `GET /api/offers` - Get offers (buyer/seller)
- `POST /api/messages` - Send message
- `GET /api/messages` - Get conversation messages

## Production Deployment Notes

1. **Environment Variables**: Update `.env` with production values
2. **Database**: Use a managed MySQL service (AWS RDS, etc.)
3. **File Storage**: Replace local uploads with cloud storage (AWS S3, Cloudinary)
4. **Email Service**: Configure SMTP for production emails
5. **HTTPS**: Enable SSL/TLS certificates
6. **Process Management**: Use PM2 or similar for Node.js process management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Open an issue in the repository
- Check the database schema for table structure
- Verify environment variables are correctly set
- Ensure MySQL service is running

---

**Happy Sustainable Shopping with EcoFinds! 🌱**
