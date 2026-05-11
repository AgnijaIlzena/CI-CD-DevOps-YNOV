const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] })
}));

describe('GET /ready', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    jest.clearAllMocks();
  });

  it('should return 200 ready when all critical checks pass', async () => {
    const response = await request(app).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.checks.database).toBe('ok');
    expect(response.body.checks.env_vars).toBe('ok');
  });

  it('should return 503 not_ready when database is unavailable', async () => {
    const db = require('../src/db');
    db.query.mockRejectedValueOnce(new Error('connection refused'));

    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not_ready');
    expect(response.body.checks.database).toBe('error');
  });

  it('should return 503 not_ready when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not_ready');
    expect(response.body.checks.env_vars).toBe('error');
  });

  it('should include all required fields', async () => {
    const response = await request(app).get('/ready');

    expect(typeof response.body.service).toBe('string');
    expect(typeof response.body.version).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
    expect(response.body.checks.cache).toBe('not_configured');
    expect(response.body.checks.payment_service).toBe('not_configured');
  });
});
