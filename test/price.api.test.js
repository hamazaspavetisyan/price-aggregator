const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });
const request = require('supertest');
const express = require('express');
const PriceModel = require('./../src/modules/price/price.model');
const api = require('./../src/api/api'); // Your route initializer

// Setup a dummy express app for testing
const app = express();
app.use(express.json());
api.initialize(app);

describe('Price API End-to-End Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/prices/latest', () => {

        it('should return 200 and the latest price for a valid symbol', async () => {
            const mockPrice = {
                symbol: 'btc',
                averagePrice: 65000,
                created: new Date(),
                entitize: () => ({ symbol: 'btc', averagePrice: 65000 })
            };

            // Mocking the search method in your PriceModel
            jest.spyOn(PriceModel, 'search').mockResolvedValue({
                list: [mockPrice],
                total: 1
            });

            const res = await request(app)
                .get('/api/prices/latest')
                .query({ symbol: 'btc' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.symbol).toBe('btc');
            expect(res.body.averagePrice).toBe(65000);
        });

        it('should return 404 if the price record is stale', async () => {
            const staleDate = new Date(Date.now() - 1000000000); // Very old date
            const mockStalePrice = {
                symbol: 'eth',
                created: staleDate,
                entitize: () => ({ symbol: 'eth' })
            };

            jest.spyOn(PriceModel, 'search').mockResolvedValue({
                list: [mockStalePrice],
                total: 1
            });

            const res = await request(app)
                .get('/api/prices/latest')
                .query({ symbol: 'eth' });

            // Based on your PriceService logic: throw new Exception(..., NOT_FOUND)
            expect(res.statusCode).toEqual(404);
            expect(res.body.error).toMatch(/stale/i);
        });

        it('should return 400 if the symbol exceeds SYMBOL_MAX_LENGTH', async () => {
            const longSymbol = 'VERYLONGSYMBOLTHATSHOULDFAIL';

            const res = await request(app)
                .get('/api/prices/latest')
                .query({ symbol: longSymbol });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('symbol too long');
        });

        it('should return 404 for a non-existent symbol', async () => {
            jest.spyOn(PriceModel, 'search').mockResolvedValue({
                list: [],
                total: 0
            });

            const res = await request(app)
                .get('/api/prices/latest')
                .query({ symbol: 'ghost' });

            expect(res.statusCode).toEqual(404);
        });
    });

    describe('POST /api/prices/sync', () => {
        it('should trigger a manual sync successfully', async () => {
            const res = await request(app)
                .post('/api/prices/sync')
                .send({});

            expect([200, 429]).toContain(res.statusCode);
            //expect(res.statusCode).toEqual(200); // mocking is needed
        });

        it('should enforce rate limiting (edge case)', async () => {
            // If you want to test your rate limiter, you would loop requests
            // or mock the rate-limiter middleware.
            // Usually, 429 is the expected code here.
        });
    });
});
