import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import pool from '../db/pool.js';
import { dropAll, migrate } from '../db/migrate.js';
import { seed } from '../db/seed.js';

// Runs only against a throwaway database: TEST_DATABASE_URL=postgres://... npm test
const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('API', () => {
  beforeAll(async () => {
    await dropAll();
    await migrate();
    await seed();
  });

  afterAll(async () => {
    await pool.end();
  });

  const newCampaign = {
    name: 'API test campaign',
    objective: 'traffic',
    dailyBudgetCents: 2_000,
    startDate: '2026-10-07',
    audience: { locations: ['San Jose, CA'], ageMin: 18, ageMax: 35, interests: ['Coffee'] },
    creative: { headline: 'Hello', body: 'Fresh coffee near you.', cta: 'Visit us' },
  };

  it('reports health', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toEqual({ ok: true, data: { status: 'ok', aiCopy: 'template' } });
  });

  it('lists seeded campaigns with totals for the range', async () => {
    const res = await request(app).get('/api/campaigns?days=7').expect(200);
    expect(res.body.data).toHaveLength(4);
    const first = res.body.data[0];
    expect(first.totals.spendCents).toBeGreaterThan(0);
    expect(first.totals.clicks).toBeLessThanOrEqual(first.totals.impressions);
  });

  it('rejects an unsupported range', async () => {
    await request(app).get('/api/campaigns?days=9').expect(400);
  });

  it('returns a full daily series per campaign', async () => {
    const res = await request(app).get('/api/campaigns/series?days=14&metric=clicks').expect(200);
    expect(res.body.data).toHaveLength(4);
    for (const series of res.body.data) expect(series.points).toHaveLength(14);
  });

  it('creates, pauses, and deletes a campaign', async () => {
    const created = await request(app).post('/api/campaigns').send(newCampaign).expect(201);
    const id = created.body.data.id;
    expect(created.body.data.status).toBe('active');

    const list = await request(app).get('/api/campaigns?days=30').expect(200);
    expect(list.body.data[0].id).toBe(id);
    expect(list.body.data[0].totals.impressions).toBeGreaterThan(0);

    const paused = await request(app).patch(`/api/campaigns/${id}/status`).send({ status: 'paused' }).expect(200);
    expect(paused.body.data.status).toBe('paused');

    await request(app).delete(`/api/campaigns/${id}`).expect(204);
    await request(app).get(`/api/campaigns/${id}`).expect(404);
  });

  it('returns field-level errors for an invalid campaign', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .send({ ...newCampaign, name: '', dailyBudgetCents: 1 })
      .expect(422);
    expect(res.body.ok).toBe(false);
    expect(res.body.issues).toHaveProperty('name');
    expect(res.body.issues).toHaveProperty('dailyBudgetCents');
  });

  it('answers malformed JSON with a 400, not a 500', async () => {
    await request(app)
      .post('/api/campaigns')
      .set('content-type', 'application/json')
      .send('{"name":')
      .expect(400);
  });

  it('generates template ad copy without an API key', async () => {
    const res = await request(app)
      .post('/api/copy/generate')
      .send({ product: 'Cold brew', audience: 'students', objective: 'traffic', tone: 'bold' })
      .expect(200);
    expect(res.body.data.source).toBe('template');
    expect(res.body.data.variants).toHaveLength(3);
  });
});
