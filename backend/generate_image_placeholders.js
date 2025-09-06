const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// A tiny 1x1 white JPEG (base64)
const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBUVFRUVFxUVFRUVFRUVFRYVFRUXFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKABJwMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABAUCAwYBB//EADwQAAIBAgQDBgQEBwAAAAAAAAECAwQRAAUSITFBBhMiUWFxgZGhBxQjQrHB0fAUYnLC0RVicpLx/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAECAwQFBv/EACMRAAICAgIDAQEBAAAAAAAAAAABAhEDIRIxBBMiQVEU/9oADAMBAAIRAxEAPwD8qREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQf/2Q==';

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecofinds',
    waitForConnections: true,
    connectionLimit: 2
  });

  try {
    const [rows] = await pool.query('SELECT DISTINCT image_url FROM product_images');
    const uploadsDir = path.resolve(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    for (const r of rows) {
      const filename = r.image_url;
      if (!filename) continue;
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        console.log('Exists:', filename);
        continue;
      }
      // write tiny jpeg
      const buffer = Buffer.from(tinyJpegBase64, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log('Created placeholder:', filename);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error generating placeholders:', err.message || err);
  } finally {
    await pool.end();
  }
}

run();
