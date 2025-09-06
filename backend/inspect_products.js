require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '02022005',
    database: process.env.DB_NAME || 'ecofinds',
    waitForConnections: true,
    connectionLimit: 1
  });

  const query = `
    SELECT p.*, c.name as category_name, u.username as seller_username, u.trust_score,
           GROUP_CONCAT(pi.image_url) as images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.is_available = true
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT 20 OFFSET 0
  `;

  try {
    const [rows] = await pool.execute(query);
    console.log('ROWS:', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err && err.stack ? err.stack : err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
