const request = require('supertest');
const express = require('express');
const app = require('../src/index');
const multer = require('multer');

// Mock server setup for testing
let server;
beforeAll((done) => {
  server = app.listen(4000, done);
});
afterAll((done) => {
  server.close(done);
});

describe('EcoScan API', () => {
  it('should return 400 if no image uploaded to /analyze-image', async () => {
    const res = await request(server).post('/analyze-image');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No image uploaded');
  });

  it('should return items for valid image upload to /analyze-image', async () => {
    const res = await request(server)
      .post('/analyze-image')
      .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'test.png');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty('name');
    expect(res.body.items[0]).toHaveProperty('carbonScore');
  });

  it('should return 400 for missing items in /eco-score', async () => {
    const res = await request(server).post('/eco-score').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No items provided');
  });

  it('should return totalCarbon and points for valid items in /eco-score', async () => {
    const res = await request(server).post('/eco-score').send({ items: ['T-shirt', 'Jeans'] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalCarbon');
    expect(res.body).toHaveProperty('points');
  });

  it('should return 400 for unknown item in /eco-score', async () => {
    const res = await request(server).post('/eco-score').send({ items: ['Unknown'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Unknown item/);
  });

  it('should return 400 for invalid points in /offers', async () => {
    const res = await request(server).get('/offers?points=abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid points value');
  });

  it('should return offers for valid points in /offers', async () => {
    const res = await request(server).get('/offers?points=15');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.offers)).toBe(true);
  });
}); 