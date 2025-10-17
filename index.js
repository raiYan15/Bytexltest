// Single clean Express API using products.json as storage
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    // If file corrupted or parse fails, log and return empty array
    console.error('readProducts error:', err.message);
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function validateProduct(body, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (body.name === undefined) errors.push('name is required');
    if (body.price === undefined) errors.push('price is required');
    if (body.inStock === undefined) errors.push('inStock is required');
  }
  if (body.name !== undefined && typeof body.name !== 'string') errors.push('name must be a string');
  if (body.price !== undefined && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  res.json(readProducts());
});

// GET /products/instock - returns only products with inStock === true
app.get('/products/instock', (req, res) => {
  const products = readProducts();
  res.json(products.filter(p => p && p.inStock === true));
});

app.post('/products', (req, res) => {
  const body = req.body || {};
  const errors = validateProduct(body, false);
  if (errors.length) return res.status(400).json({ errors });

  const products = readProducts();
  const id = products.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;
  const product = { id, name: body.name, price: body.price, inStock: body.inStock };
  products.push(product);
  writeProducts(products);
  res.status(201).json(product);
});

app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const body = req.body || {};
  const errors = validateProduct(body, true);
  if (errors.length) return res.status(400).json({ errors });

  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const existing = products[idx];
  const updated = { id: existing.id, name: body.name !== undefined ? body.name : existing.name, price: body.price !== undefined ? body.price : existing.price, inStock: body.inStock !== undefined ? body.inStock : existing.inStock };
  products[idx] = updated;
  writeProducts(products);
  res.json(updated);
});

app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  writeProducts(products);
  res.json({ message: 'Product deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to read products: ' + err.message);
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    throw new Error('Failed to write products: ' + err.message);
  }
}

function validateProduct(payload, forUpdate = false) {
  const errors = [];
  if (!forUpdate || payload.hasOwnProperty('name')) {
    if (typeof payload.name !== 'string' || payload.name.trim() === '') {
      errors.push('name must be a non-empty string');
    }
  }
  if (!forUpdate || payload.hasOwnProperty('price')) {
    if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) {
      errors.push('price must be a number');
    }
  }
  if (!forUpdate || payload.hasOwnProperty('inStock')) {
    if (typeof payload.inStock !== 'boolean') {
      errors.push('inStock must be a boolean');
    }
  }
  return errors;
}

app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    const inStock = products.filter(p => p && p.inStock === true);
    res.json(inStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const payload = req.body;
    const errors = validateProduct(payload, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newProduct = {
      id: maxId + 1,
      name: payload.name,
      price: payload.price,
      inStock: payload.inStock
    };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    const payload = req.body;
    const errors = validateProduct(payload, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'product not found' });

    const updated = Object.assign({}, products[idx], payload);
    products[idx] = updated;
    writeProducts(products);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'product not found' });

    products.splice(idx, 1);
    writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to read products: ' + err.message);
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    throw new Error('Failed to write products: ' + err.message);
  }
}

function validateProduct(payload, forUpdate = false) {
  const errors = [];
  if (!forUpdate || payload.hasOwnProperty('name')) {
    if (typeof payload.name !== 'string' || payload.name.trim() === '') {
      errors.push('name must be a non-empty string');
    }
  }
  if (!forUpdate || payload.hasOwnProperty('price')) {
    if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) {
      errors.push('price must be a number');
    }
  }
  if (!forUpdate || payload.hasOwnProperty('inStock')) {
    if (typeof payload.inStock !== 'boolean') {
      errors.push('inStock must be a boolean');
    }
  }
  return errors;
}

// GET /products - return all products
app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /products/instock - return only products with inStock === true
app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    const inStock = products.filter(p => p && p.inStock === true);
    res.json(inStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /products - create new product with auto-incremented id
app.post('/products', (req, res) => {
  try {
  const payload = req.body;
  const errors = validateProduct(payload, false);
  if (errors.length) return res.status(400).json({ errors });

  const products = readProducts();
  const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
  const newProduct = {
  id: maxId + 1,
  name: payload.name,
  price: payload.price,
      inStock: payload.inStock
    };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PUT /products/:id - update an existing product (partial allowed)
app.put('/products/:id', (req, res) => {
  try {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const payload = req.body;
  const errors = validateProduct(payload, true);
  if (errors.length) return res.status(400).json({ errors });

  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'product not found' });

  const updated = Object.assign({}, products[idx], payload);
  products[idx] = updated;
  writeProducts(products);
  res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE /products/:id - remove product
app.delete('/products/:id', (req, res) => {
  try {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'product not found' });

  products.splice(idx, 1);
    writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

const readProducts = () => {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return raw ? JSON.parse(raw) : [];
};

const writeProducts = (arr) => fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');

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
app.listen(PORT, () => console.log('Server listening on', PORT));
// Final minimal implementation (single copy)
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function validateProduct(body, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (body.name === undefined) errors.push('name is required');
    if (body.price === undefined) errors.push('price is required');
    if (body.inStock === undefined) errors.push('inStock is required');
  }
  if (body.name !== undefined && typeof body.name !== 'string') errors.push('name must be a string');
  if (body.price !== undefined && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => res.json(readProducts()));

app.get('/products/instock', (req, res) => res.json(readProducts().filter(p => p.inStock === true)));

app.post('/products', (req, res) => {
  const body = req.body || {};
  const errors = validateProduct(body, false);
  if (errors.length) return res.status(400).json({ errors });
  const products = readProducts();
  const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
  const newProduct = { id: maxId + 1, name: body.name, price: body.price, inStock: body.inStock };
  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const body = req.body || {};
  const errors = validateProduct(body, true);
  if (errors.length) return res.status(400).json({ errors });
  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const existing = products[idx];
  const updated = { id: existing.id, name: body.name !== undefined ? body.name : existing.name, price: body.price !== undefined ? body.price : existing.price, inStock: body.inStock !== undefined ? body.inStock : existing.inStock };
  products[idx] = updated;
  writeProducts(products);
  res.json(updated);
});

app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  writeProducts(products);
  res.json({ message: 'Product deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
// Single clean Express API using products.json as storage
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    // If file is corrupt, treat as empty but log error
    console.error('readProducts error:', err.message);
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function validateProduct(body, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (body.name === undefined) errors.push('name is required');
    if (body.price === undefined) errors.push('price is required');
    if (body.inStock === undefined) errors.push('inStock is required');
  }
  if (body.name !== undefined && typeof body.name !== 'string') errors.push('name must be a string');
  if (body.price !== undefined && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  res.json(readProducts());
});

app.get('/products/instock', (req, res) => {
  const products = readProducts();
  res.json(products.filter(p => p.inStock === true));
});

app.post('/products', (req, res) => {
  const body = req.body || {};
  const errors = validateProduct(body, false);
  if (errors.length) return res.status(400).json({ errors });

  const products = readProducts();
  const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
  const newProduct = { id: maxId + 1, name: body.name, price: body.price, inStock: body.inStock };
  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const body = req.body || {};
  const errors = validateProduct(body, true);
  if (errors.length) return res.status(400).json({ errors });

  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const existing = products[idx];
  const updated = {
    id: existing.id,
    name: body.name !== undefined ? body.name : existing.name,
    price: body.price !== undefined ? body.price : existing.price,
    inStock: body.inStock !== undefined ? body.inStock : existing.inStock
  };
  products[idx] = updated;
  writeProducts(products);
  res.json(updated);
});

app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const products = readProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  products.splice(idx, 1);
  writeProducts(products);
  res.json({ message: 'Product deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
// Clean single-file implementation
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to read products data: ' + err.message);
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    throw new Error('Failed to write products data: ' + err.message);
  }
}

function validateProduct(body, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (body.name === undefined) errors.push('name is required');
    if (body.price === undefined) errors.push('price is required');
    if (body.inStock === undefined) errors.push('inStock is required');
  }
  if (body.name !== undefined && typeof body.name !== 'string') errors.push('name must be a string');
  if (body.price !== undefined && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  try {
    res.json(readProducts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    res.json(products.filter(p => p.inStock === true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateProduct(body, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newProduct = { id: maxId + 1, name: body.name, price: body.price, inStock: body.inStock };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const body = req.body || {};
    const errors = validateProduct(body, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const existing = products[idx];
    const updated = {
      id: existing.id,
      name: body.name !== undefined ? body.name : existing.name,
      price: body.price !== undefined ? body.price : existing.price,
      inStock: body.inStock !== undefined ? body.inStock : existing.inStock
    };
    products[idx] = updated;
    writeProducts(products);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    writeProducts(products);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file:', err);
    throw new Error('Failed to read data');
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data file:', err);
    throw new Error('Failed to write data');
  }
}

function validateProduct(payload, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (payload.name === undefined) errors.push('name is required');
    if (payload.price === undefined) errors.push('price is required');
    if (payload.inStock === undefined) errors.push('inStock is required');
  }
  if (payload.name !== undefined && typeof payload.name !== 'string') errors.push('name must be a string');
  if (payload.price !== undefined && (typeof payload.price !== 'number' || Number.isNaN(payload.price))) errors.push('price must be a number');
  if (payload.inStock !== undefined && typeof payload.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  try {
    res.json(readData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readData();
    res.json(products.filter(p => p.inStock === true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const payload = req.body || {};
    const errors = validateProduct(payload, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readData();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const product = { id: maxId + 1, name: payload.name, price: payload.price, inStock: payload.inStock };
    products.push(product);
    writeData(products);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const payload = req.body || {};
    const errors = validateProduct(payload, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readData();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const updated = Object.assign({}, products[idx], payload);
    products[idx] = updated;
    writeData(products);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const products = readData();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    writeData(products);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file:', err);
    throw new Error('Failed to read data');
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data file:', err);
    throw new Error('Failed to write data');
  }
}

function validateProduct(payload, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (payload.name === undefined) errors.push('name is required');
    if (payload.price === undefined) errors.push('price is required');
    if (payload.inStock === undefined) errors.push('inStock is required');
  }
  if (payload.name !== undefined && typeof payload.name !== 'string') errors.push('name must be a string');
  if (payload.price !== undefined && (typeof payload.price !== 'number' || Number.isNaN(payload.price))) errors.push('price must be a number');
  if (payload.inStock !== undefined && typeof payload.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  try {
    res.json(readData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readData();
    res.json(products.filter(p => p.inStock === true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const payload = req.body || {};
    const errors = validateProduct(payload, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readData();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const product = { id: maxId + 1, name: payload.name, price: payload.price, inStock: payload.inStock };
    products.push(product);
    writeData(products);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const payload = req.body || {};
    const errors = validateProduct(payload, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readData();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const updated = Object.assign({}, products[idx], payload);
    products[idx] = updated;
    writeData(products);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const products = readData();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    writeData(products);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data:', err);
    throw new Error('Failed to read data');
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data:', err);
    throw new Error('Failed to write data');
  }
}

function validateProduct(payload, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (payload.name === undefined) errors.push('name is required');
    if (payload.price === undefined) errors.push('price is required');
    if (payload.inStock === undefined) errors.push('inStock is required');
  }
  if (payload.name !== undefined && typeof payload.name !== 'string') errors.push('name must be a string');
  if (payload.price !== undefined && (typeof payload.price !== 'number' || Number.isNaN(payload.price))) errors.push('price must be a number');
  if (payload.inStock !== undefined && typeof payload.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  try {
    const products = readData();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readData();
    res.json(products.filter(p => p.inStock === true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const payload = req.body || {};
    const errors = validateProduct(payload, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readData();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newProduct = { id: maxId + 1, name: payload.name, price: payload.price, inStock: payload.inStock };
    products.push(newProduct);
    writeData(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const payload = req.body || {};
    const errors = validateProduct(payload, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readData();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const updated = Object.assign({}, products[idx], payload);
    products[idx] = updated;
    writeData(products);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const products = readData();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    writeData(products);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to read products data: ' + err.message);
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    throw new Error('Failed to write products data: ' + err.message);
  }
}

function validateProduct(body, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (body.name === undefined) errors.push('name is required');
    if (body.price === undefined) errors.push('price is required');
    if (body.inStock === undefined) errors.push('inStock is required');
  }
  if (body.name !== undefined && typeof body.name !== 'string') errors.push('name must be a string');
  if (body.price !== undefined && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  try {
    res.json(readProducts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    res.json(products.filter(p => p.inStock === true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateProduct(body, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newProduct = { id: maxId + 1, name: body.name, price: body.price, inStock: body.inStock };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const body = req.body || {};
    const errors = validateProduct(body, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const existing = products[idx];
    const updated = {
      id: existing.id,
      name: body.name !== undefined ? body.name : existing.name,
      price: body.price !== undefined ? body.price : existing.price,
      inStock: body.inStock !== undefined ? body.inStock : existing.inStock
    };
    products[idx] = updated;
    writeProducts(products);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    writeProducts(products);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'products.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to read products data: ' + err.message);
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    throw new Error('Failed to write products data: ' + err.message);
  }
}

function validateProduct(body, forUpdate = false) {
  const errors = [];
  if (!forUpdate) {
    if (body.name === undefined) errors.push('name is required');
    if (body.price === undefined) errors.push('price is required');
    if (body.inStock === undefined) errors.push('inStock is required');
  }
  if (body.name !== undefined && typeof body.name !== 'string') errors.push('name must be a string');
  if (body.price !== undefined && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
  return errors;
}

app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    res.json(products.filter(p => p.inStock === true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', (req, res) => {
  try {
    const body = req.body;
    const errors = validateProduct(body, false);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newProduct = { id: maxId + 1, name: body.name, price: body.price, inStock: body.inStock };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

    const body = req.body;
    const errors = validateProduct(body, true);
    if (errors.length) return res.status(400).json({ errors });

    const products = readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const express = require('express');
    const fs = require('fs');
    const path = require('path');

    const app = express();
    app.use(express.json());

    const DATA_FILE = path.join(__dirname, 'products.json');

    function readData() {
      try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        if (!raw) return [];
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading data:', err);
        throw new Error('Failed to read data');
      }
    }

    function writeData(data) {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      } catch (err) {
        console.error('Error writing data:', err);
        throw new Error('Failed to write data');
      }
    }

    function validateProduct(payload, forUpdate = false) {
      const errors = [];
      if (!forUpdate) {
        if (payload.name === undefined) errors.push('name is required');
        if (payload.price === undefined) errors.push('price is required');
        if (payload.inStock === undefined) errors.push('inStock is required');
      }
      if (payload.name !== undefined && typeof payload.name !== 'string') errors.push('name must be a string');
      if (payload.price !== undefined && (typeof payload.price !== 'number' || Number.isNaN(payload.price))) errors.push('price must be a number');
      if (payload.inStock !== undefined && typeof payload.inStock !== 'boolean') errors.push('inStock must be a boolean');
      return errors;
    }

    app.get('/products', (req, res) => {
      try {
        const products = readData();
        res.json(products);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get('/products/instock', (req, res) => {
      try {
        const products = readData();
        res.json(products.filter(p => p.inStock === true));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/products', (req, res) => {
      try {
        const payload = req.body || {};
        const errors = validateProduct(payload, false);
        if (errors.length) return res.status(400).json({ errors });

        const products = readData();
        const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
        const newProduct = { id: maxId + 1, name: payload.name, price: payload.price, inStock: payload.inStock };
        products.push(newProduct);
        writeData(products);
        res.status(201).json(newProduct);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.put('/products/:id', (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

        const payload = req.body || {};
        const errors = validateProduct(payload, true);
        if (errors.length) return res.status(400).json({ errors });

        const products = readData();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Product not found' });

        const updated = Object.assign({}, products[idx], payload);
        products[idx] = updated;
        writeData(products);
        res.json(updated);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/products/:id', (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

        const products = readData();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Product not found' });

        products.splice(idx, 1);
        writeData(products);
        res.json({ message: 'Product deleted successfully' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
      const errors = [];
      if (!forUpdate) {
        if (body.name == null) errors.push('name is required');
        if (body.price == null) errors.push('price is required');
        if (body.inStock == null) errors.push('inStock is required');
      }
      if (body.name != null && typeof body.name !== 'string') errors.push('name must be a string');
      if (body.price != null && (typeof body.price !== 'number' || Number.isNaN(body.price))) errors.push('price must be a number');
      if (body.inStock != null && typeof body.inStock !== 'boolean') errors.push('inStock must be a boolean');
      return errors;
    }

    app.get('/products', (req, res) => {
      try {
        const products = readProducts();
        res.json(products);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Bonus: in-stock products
    app.get('/products/instock', (req, res) => {
      try {
        const products = readProducts();
        const instock = products.filter(p => p.inStock === true);
        res.json(instock);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/products', (req, res) => {
      try {
        const body = req.body;
        const errors = validateProductBody(body, false);
        if (errors.length) return res.status(400).json({ errors });

        const products = readProducts();
        const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
        const newProduct = {
          id: maxId + 1,
          name: body.name,
          price: body.price,
          inStock: body.inStock
        };
        products.push(newProduct);
        writeProducts(products);
        res.status(201).json(newProduct);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.put('/products/:id', (req, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
        const body = req.body;
        const errors = validateProductBody(body, true);
        if (errors.length) return res.status(400).json({ errors });

        const products = readProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Product not found' });

        const existing = products[idx];
        const updated = Object.assign({}, existing, {
          name: body.name != null ? body.name : existing.name,
          price: body.price != null ? body.price : existing.price,
          inStock: body.inStock != null ? body.inStock : existing.inStock
        });
        products[idx] = updated;
        writeProducts(products);
        res.json(updated);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/products/:id', (req, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
        const products = readProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Product not found' });
        products.splice(idx, 1);
        writeProducts(products);
        res.json({ message: 'Product deleted' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
