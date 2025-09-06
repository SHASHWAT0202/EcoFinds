// quick_login_test.js
// Attempts to login as admin and perform cart/order actions to reproduce failures.
const axios = require('axios');
const base = 'http://localhost:3001/api';

async function main() {
  try {
    const loginResp = await axios.post(base + '/auth/login', { email: 'admin@ecofinds.com', password: 'admin123' });
    console.log('Login resp:', loginResp.status, loginResp.data.user ? loginResp.data.user.id : null);
    const token = loginResp.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    const productsResp = await axios.get(base + '/products');
    console.log('Products count:', productsResp.data.products ? productsResp.data.products.length : 'none');
    if (!productsResp.data.products || productsResp.data.products.length === 0) return;
    const product = productsResp.data.products[0];
    console.log('Using product:', product.id);

    // Try add to cart
    try {
      const addResp = await axios.post(base + '/cart', { productId: product.id, quantity: 1 }, { headers });
      console.log('Add to cart:', addResp.status, addResp.data);
    } catch (e) {
      console.error('Add to cart failed:', e.response ? e.response.status : '', e.response ? e.response.data : e.message);
    }

    // Try create order
    try {
      const orderResp = await axios.post(base + '/orders', { shippingAddress: '123 Test St' }, { headers });
      console.log('Order created:', orderResp.status, orderResp.data);
    } catch (e) {
      console.error('Create order failed:', e.response ? e.response.status : '', e.response ? e.response.data : e.message);
    }

    // Fetch cart and orders
    const cart = await axios.get(base + '/cart', { headers });
    console.log('Cart items:', cart.data.items ? cart.data.items.length : 0);
    const orders = await axios.get(base + '/orders', { headers });
    console.log('Orders count:', orders.data.orders ? orders.data.orders.length : 0);

  } catch (err) {
    console.error('Script error:', err.response ? err.response.data : err.message);
  }
}

main();
