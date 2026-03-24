// rpc-server.js
const RPC = require('@hyperswarm/rpc');
const crypto = require('hypercore-crypto');
const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const DHT = require('hyperdht');
const appUtl = require('../shared/app-utl');
const PriceService = require('../modules/price/price.service');

class RpcNode {
    constructor(storagePath = './db/rpc-server') {
        this.storagePath = storagePath;
        this.hcore = null;
        this.hbee = null;
        this.dht = null;
        this.rpc = null;
        this.rpcServer = null;
    }

    async start() {
        try {
            // 1. Initialize Hypercore + Hyperbee
            this.hcore = new Hypercore(this.storagePath);
            this.hbee = new Hyperbee(this.hcore, {
                keyEncoding: 'utf-8',
                valueEncoding: 'binary'
            });
            await this.hbee.ready();

            appUtl.log.info('Hyperbee storage ready');

            // 2. DHT with persisted seed
            const dhtSeed = await this.getOrCreateSeed('dht-seed');
            this.dht = new DHT({
                port: 40001,
                keyPair: DHT.keyPair(dhtSeed),
                bootstrap: [{ host: '127.0.0.1', port: 30001 }]
            });
            await this.dht.ready();

            appUtl.log.info('DHT ready');

            // 3. RPC with persisted seed
            const rpcSeed = await this.getOrCreateSeed('rpc-seed');
            this.rpc = new RPC({ seed: rpcSeed, dht: this.dht });
            this.rpcServer = this.rpc.createServer();

            // 4. Register handlers
            this.setupHandlers();

            await this.rpcServer.listen();

            appUtl.log.info(
                `🎧 RPC server listening on public key -> ${this.rpcServer.publicKey.toString('hex')}`
            );

        } catch (err) {
            appUtl.log.error(`failed to start RPC server: ${err.message}`);
            throw err;
        }
    }

    async getOrCreateSeed(key) {
        let entry = await this.hbee.get(key);
        let seed = entry ? entry.value : null;

        if (!seed) {
            seed = crypto.randomBytes(32);
            await this.hbee.put(key, seed);
            appUtl.log.info(`created new seed for ${key}`);
        } else {
            appUtl.log.debug(`loaded existing seed for ${key}`);
        }

        return seed;
    }

    setupHandlers() {
        // Ping handler
        this.rpcServer.respond('ping', async (rawRequest) => {
            try {
                const requestStr = rawRequest.toString();
                appUtl.log.debug(`RPC ping received: ${requestStr}`);

                return Buffer.from(JSON.stringify({
                    value: 'pong',
                    timestamp: Date.now()
                }));

            } catch (err) {
                appUtl.log.error(`RPC ping handler error: ${err.message}`);
                return Buffer.from(JSON.stringify({
                    error: `invalid request: ${err.message}`
                }));
            }
        });

        // our price handler
        this.rpcServer.respond('getLatestPrice', async (rawRequest) => {
            try {
                // Parse incoming request
                const request = JSON.parse(rawRequest.toString());
                const symbol = (request.symbol || '').toUpperCase().trim();

                if (!symbol) {
                    throw new Error('symbol is required');
                }

                appUtl.log.debug(`RPC getLatestPrice requested for symbol: ${symbol}`);

                // Call your existing PriceService method
                const priceData = await PriceService.getLatestPrices(symbol);

                appUtl.log.info(`RPC successfully returned price for ${symbol}`);

                return Buffer.from(JSON.stringify({
                    success: true,
                    data: priceData
                }));

            } catch (err) {
                const errorMsg = err.message || 'Unknown error';

                // Log with appropriate level
                if (err.code === 'BAD_REQUEST' || err.code === 'NOT_FOUND') {
                    appUtl.log.warn(`RPC getLatestPrice failed for symbol: ${errorMsg}`);
                } else {
                    appUtl.log.error(`RPC getLatestPrice error: ${errorMsg}`);
                }

                return Buffer.from(JSON.stringify({
                    success: false,
                    error: errorMsg
                }));
            }
        });
    }

    async stop() {
        try {
            if (this.rpcServer) await this.rpcServer.close();
            if (this.dht) await this.dht.destroy();
            if (this.hcore) await this.hcore.close();

            appUtl.log.info('RPC server stopped gracefully');
        } catch (err) {
            appUtl.log.error(`error while stopping RPC server: ${err.message}`);
        }
    }
}

module.exports = RpcNode;
