const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const pool = require('./db');
const logger = require('./logger');
const { version } = require('../package.json');

const app = express();
const startTime = Date.now();

app.use(cors());
app.use(express.json());

// Attach a unique ID to every request and log it when the response is sent
app.use((req, res, next) => {
  req.requestId = randomUUID();
  const start = Date.now();

  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      route: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      requestId: req.requestId,
    });
  });

  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur TrainShop Starter',
    endpoints: ['/health', '/products']
  });
});

app.get('/health', async (req, res) => {
  const base = {
    service: 'trainshop-api',
    version: process.env.APP_VERSION || version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  try {
    await pool.query('SELECT 1');

    logger.info('dependency', { check: 'database', status: 'ok' });
    res.json({
      status: 'ok',
      ...base,
      dependencies: { database: 'connected' },
    });
  } catch (error) {
    logger.error('dependency', { check: 'database', status: 'error', message: error.message });
    res.status(503).json({
      status: 'error',
      ...base,
      dependencies: { database: 'unavailable' },
    });
  }
});

app.get('/ready', async (req, res) => {
  const checks = {};

  checks.env_vars = process.env.DATABASE_URL ? 'ok' : 'error';

  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  checks.cache = 'not_configured';
  checks.payment_service = 'not_configured';

  if (checks.env_vars === 'error') {
    logger.error('dependency', { check: 'env_vars', status: 'error', missing: 'DATABASE_URL' });
  }
  if (checks.database === 'error') {
    logger.error('dependency', { check: 'database', status: 'error' });
  }

  const criticalFailed = checks.env_vars === 'error' || checks.database === 'error';

  const status = criticalFailed ? 503 : 200;
  res.status(status).json({
    status: criticalFailed ? 'not_ready' : 'ready',
    service: 'trainshop-api',
    version: process.env.APP_VERSION || version,
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get('/about', (req, res) => {
  try {
    const projectInfo = {
      'project': 'TrainShop Starter',
      'module': 'DevOps',
      'objective': 'Créer une CI GitHub Actions'
    };

    res.json(projectInfo);
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des informations du projet',
      message: error.message
    });
  }
});

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('error', {
      method: req.method,
      route: req.path,
      message: error.message,
      requestId: req.requestId,
    });
    res.status(500).json({
      error: 'Impossible de récupérer les produits',
      message: error.message
    });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Produit introuvable'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('error', {
      method: req.method,
      route: req.path,
      message: error.message,
      requestId: req.requestId,
    });
    res.status(500).json({
      error: 'Impossible de récupérer le produit',
      message: error.message
    });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, description, price_cents, stock } = req.body;

    if (!name || !description || !price_cents) {
      return res.status(400).json({
        error: 'name, description et price_cents sont obligatoires'
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price_cents, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, price_cents, stock`,
      [name, description, price_cents, stock || 0]
    );

    logger.info('business', {
      action: 'product_created',
      productId: result.rows[0].id,
      name: result.rows[0].name,
      requestId: req.requestId,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('error', {
      method: req.method,
      route: req.path,
      message: error.message,
      requestId: req.requestId,
    });
    res.status(500).json({
      error: 'Impossible de créer le produit',
      message: error.message
    });
  }
});

app.post('/orders', async (_req, _res) => {});

app.post('/checkout', async (_req, _res) => {});

// Catch unhandled Express errors and log them before responding
app.use((err, req, res, _next) => {
  logger.error('error', {
    method: req.method,
    route: req.path,
    message: err.message,
    requestId: req.requestId,
  });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
