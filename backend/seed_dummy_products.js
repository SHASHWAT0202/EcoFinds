const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecofinds',
    waitForConnections: true,
    connectionLimit: 5
  });

  const db = pool;

  try {
    console.log('Fetching categories...');
    const [cats] = await db.query('SELECT id, name FROM categories');
    if (cats.length === 0) {
      console.error('No categories found - ensure schema is loaded');
      return;
    }

    // Ensure there's at least one user to assign as seller
    const [users] = await db.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.error('No users found - create a user first (see schema.sql sample admin user)');
      return;
    }
    const sellerId = users[0].id;

    for (const cat of cats) {
      console.log(`Seeding category ${cat.id} - ${cat.name}`);

      for (let i = 1; i <= 2; i++) {
        const title = `${cat.name} Sample Item ${i}`;
        const description = `This is a sample ${cat.name.toLowerCase()} item generated for development.`;
        const price = (Math.random() * 100 + 10).toFixed(2);
        const year = 2020 + Math.floor(Math.random() * 6);
        const condition = ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)];
        const ecoScore = Math.floor(Math.random() * 40) + 60;
        const location = 'Sample City';

        const [res] = await db.query(
          `INSERT INTO products (seller_id, category_id, title, description, price, year_of_manufacture, condition_rating, eco_score, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sellerId, cat.id, title, description, price, year, condition, ecoScore, location]
        );

        const productId = res.insertId;

        // Insert a dummy image filename so frontend has something to load
        const imageFilename = `product-seed-${productId}.jpg`;
        await db.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)', [productId, imageFilename, true]);

        console.log(`  Inserted product ${productId}`);
      }
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
