Quickstart - Backend

1. Ensure MySQL is running and `backend/.env` has correct DB credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).

2. Start the backend server:

```powershell
cd 'c:\Main advance projects with trash\EcoFinds\backend'
node server.js
```

3. Seed dummy products (adds 2 products per category):

```powershell
cd 'c:\Main advance projects with trash\EcoFinds\backend'
node seed_dummy_products.js
```

4. Verify basic endpoints manually or using the verify script (if available):

```powershell
# Health
Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -Method Get

# Products
Invoke-RestMethod -Uri 'http://localhost:3001/api/products' -Method Get

# Notifications (requires auth)
Invoke-RestMethod -Uri 'http://localhost:3001/api/notifications' -Method Get -Headers @{ Authorization = 'Bearer <token>' }
```

Notes:
- The seed script assumes at least one user exists (the sample admin user in schema.sql). If not, create a user first.
- The seed script inserts product image filenames only; to display images in the frontend, add matching files to the `uploads/` folder or update image URLs.
