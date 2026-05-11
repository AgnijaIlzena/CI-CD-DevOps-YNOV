const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

describe('GET /products', () => {
  it('should return products list', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Guide Docker',
          description: 'Support pédagogique',
          price_cents: 1900,
          stock: 20
        }
      ]
    });

    const response = await request(app).get('/products');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Guide Docker');
  });
});

describe('POST /products', () => {
  it('should create a product with valid data', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          name: 'Guide Kubernetes',
          description: 'Support avancé',
          price_cents: 2900,
          stock: 5
        }
      ]
    });

    const response = await request(app)
      .post('/products')
      .send({ name: 'Guide Kubernetes', description: 'Support avancé', price_cents: 2900, stock: 5 });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Guide Kubernetes');
    expect(response.body.price_cents).toBe(2900);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app)
      .post('/products')
      .send({ name: 'Produit incomplet' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
