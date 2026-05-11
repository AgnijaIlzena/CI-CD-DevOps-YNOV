const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] })
}));

describe('GET /health', () => {
  it('should return 200 with required fields when DB is up', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('trainshop-api');
    expect(typeof response.body.version).toBe('string');
    expect(typeof response.body.environment).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.dependencies.database).toBe('connected');
  });

  it('should return 503 when DB is unavailable', async () => {
    const db = require('../src/db');
    db.query.mockRejectedValueOnce(new Error('connection refused'));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.dependencies.database).toBe('unavailable');
  });

  it('should never expose sensitive data', async () => {
    const response = await request(app).get('/health');
    const body = JSON.stringify(response.body);

    expect(body).not.toMatch(/password/i);
    expect(body).not.toMatch(/DATABASE_URL/i);
    expect(body).not.toMatch(/secret/i);
    expect(body).not.toMatch(/token/i);
  });
});
