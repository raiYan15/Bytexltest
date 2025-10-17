# Bytexl Products API

Simple Express.js API that stores products in a local `products.json` file. No external database required.

Available endpoints:

- GET /products → returns all products
- GET /products/instock → returns only products where inStock is true
- POST /products → create a product { name, price, inStock }
- PUT /products/:id → update a product (partial updates allowed)
- DELETE /products/:id → delete a product

Run:

```powershell
npm install
npm start
```

Examples (PowerShell):

Get all products:

```powershell
Invoke-RestMethod http://localhost:3000/products
```

Create a product:

```powershell
Invoke-RestMethod -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{name='Keyboard';price=1500;inStock=$true}) http://localhost:3000/products
```
# Bytexl Products API

Simple Express API that stores product data in a local `products.json` file.

Endpoints:

- GET /products - returns all products
- GET /products/instock - returns products where inStock is true
- POST /products - create a product { name, price, inStock }
- PUT /products/:id - update a product fields
- DELETE /products/:id - delete a product

Run:

1. Install deps: npm install
2. Start: npm start

Example PowerShell tests:

```powershell
# Get all
Invoke-RestMethod -Method Get -Uri http://localhost:3000/products | ConvertTo-Json -Depth 5

# Create
Invoke-RestMethod -Method Post -Uri http://localhost:3000/products -Body (ConvertTo-Json @{name='Keyboard'; price=1500; inStock=$true}) -ContentType 'application/json'

# Update
Invoke-RestMethod -Method Put -Uri http://localhost:3000/products/1 -Body (ConvertTo-Json @{price=59000}) -ContentType 'application/json'

# Delete
Invoke-RestMethod -Method Delete -Uri http://localhost:3000/products/2

# Get in-stock
Invoke-RestMethod -Method Get -Uri http://localhost:3000/products/instock | ConvertTo-Json -Depth 5
```
