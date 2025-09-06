// test_cart_order_flow.js
// Run this script from the backend folder while the server is running.
// It will signup/login a test user, add a product to cart, create an order, then fetch cart and orders.

const axios = require('axios');
const base = 'http://localhost:3001/api';

async function main() {
  try {
    // 1) Ensure test user exists via signup (idempotent if email already exists will return 409)
    const test = { username: 'testuser_cli', email: 'testuser_cli@example.com', password: 'password123' };
    try {
      const signup = await axios.post(base + '/auth/signup', test);
      console.log('Signed up:', signup.data.user.id);
    } catch (e) {
      if (e.response && e.response.status === 409) {
        console.log('User already exists, proceeding to login');
      } else {
        console.error('Signup error (non-409):', e.response ? e.response.data : e.message);
      }
    }

    // 2) Login
    const loginResp = await axios.post(base + '/auth/login', { email: test.email, password: test.password });
    const token = loginResp.data.token;
    console.log('Logged in, token length:', token ? token.length : null);

    const headers = { Authorization: `Bearer ${token}` };

    // 3) Find a product id to add to cart
    const productsResp = await axios.get(base + '/products');
    if (!productsResp.data || !Array.isArray(productsResp.data.products) || productsResp.data.products.length === 0) {
      console.error('No products found to test with. Seed some products first.');
      return;
    }

    const product = productsResp.data.products[0];
    console.log('Using product:', product.id, product.title || product.name || '(no title)');

    // 4) POST /api/cart
    const addResp = await axios.post(base + '/cart', { productId: product.id, quantity: 1 }, { headers });
    console.log('Add to cart response:', addResp.status, addResp.data);

    // 5) GET /api/cart
    const cartResp = await axios.get(base + '/cart', { headers });
    console.log('Cart contents:', cartResp.data);

    // 6) POST /api/orders (mock checkout)
    const orderResp = await axios.post(base + '/orders', { shippingAddress: '123 Test St, Testville' }, { headers });
    console.log('Order response:', orderResp.status, orderResp.data);

    // 7) GET /api/orders
    const ordersResp = await axios.get(base + '/orders', { headers });
    console.log('Orders list:', ordersResp.data.orders ? ordersResp.data.orders.length : ordersResp.data);

  } catch (err) {
    console.error('Script error:', err.response ? err.response.data : err.message);
  }
}

main();
