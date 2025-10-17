const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return raw ? JSON.parse(raw) : [];
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

app.get('/products', (req, res) => res.json(readProducts()));

app.get('/products/instock', (req, res) => res.json(readProducts().filter(p => p.inStock === true)));

app.post('/products', (req, res) => {
  const { name, price, inStock } = req.body || {};
  if (typeof name !== 'string' || typeof price !== 'number' || typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'Invalid product body' });
  }
  const products = readProducts();
  const id = products.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;
  const prod = { id, name, price, inStock };
  products.push(prod);
  writeProducts(products);
  res.status(201).json(prod);
});

app.put('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const products = readProducts();
  const i = products.findIndex(p => p.id === id);
  if (i === -1) return res.status(404).json({ error: 'Product not found' });
  const payload = req.body || {};
  const updated = Object.assign({}, products[i], payload);
  products[i] = updated;
  writeProducts(products);
  res.json(updated);
});

app.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const products = readProducts();
  const i = products.findIndex(p => p.id === id);
  if (i === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(i, 1);
  writeProducts(products);
  res.json({ message: 'Product deleted' });
});

const PORT = process.env.PORT || 3000;
// bind to localhost explicitly for local-only access
app.listen(PORT, '127.0.0.1', () => console.log(`Server listening on http://127.0.0.1:${PORT}`));
