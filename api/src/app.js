const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { version } = require('../package.json');

const app = express();
const startTime = Date.now();

app.use(cors());
app.use(express.json());

// const x = 1;

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

    res.json({
      status: 'ok',
      ...base,
      dependencies: { database: 'connected' },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      ...base,
      dependencies: { database: 'unavailable' },
    });
  }
});

app.get('/ready', async (req, res) => {
  const checks = {};

  // Check 1: required environment variables
  checks.env_vars = process.env.DATABASE_URL ? 'ok' : 'error';

  // Check 2: database
  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Check 3: cache — not used in this project
  checks.cache = 'not_configured';

  // Check 4: external payment service — not used in this project
  checks.payment_service = 'not_configured';

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

// app.get('/about', async (req, res) => {
//   try {
//     const result = await pool.query(
//       'SELECT project, module, objective FROM about ORDER BY id ASC'
//     );

//     res.json(result.rows);
//   } catch (error) {
//     res.status(500).json({
//       error: 'Impossible de récupérer les produits',
//       message: error.message
//     });
//   }
// });

app.get('/about', (req, res) => {
  try {
    // On remplace la requête SQL par l'objet JSON demandé
    const projectInfo = {
      "project": "TrainShop Starter",
      "module": "DevOps",
      "objective": "Créer une CI GitHub Actions"
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de créer le produit',
      message: error.message
    });
  }
});

app.post('/orders', async (_req, _res) => {
  // try {
  //   const { name, description, price_cents, stock } = req.body;

  //   if (!name || !description || !price_cents) {
  //     return res.status(400).json({
  //       error: 'name, description et price_cents sont obligatoires'
  //     });
  //   }

  //   const result = await pool.query(
  //     `INSERT INTO products (name, description, price_cents, stock)
  //      VALUES ($1, $2, $3, $4)
  //      RETURNING id, name, description, price_cents, stock`,
  //     [name, description, price_cents, stock || 0]
  //   );

  //   res.status(201).json(result.rows[0]);
  // } catch (error) {
  //   res.status(500).json({
  //     error: 'Impossible de créer le produit',
  //     message: error.message
  //   });
  // }
});

app.post('/checkout', async (_req, _res) => {})

module.exports = app;
