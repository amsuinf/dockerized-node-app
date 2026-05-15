const request = require('supertest');
const app = require('../src/index');

describe('Health endpoint', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('Shorten validation', () => {
  it('rejects non-URL input', async () => {
    const res = await request(app).post('/shorten').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('rejects empty input', async () => {
    const res = await request(app).post('/shorten').send({});
    expect(res.status).toBe(400);
  });
});
