const PriceModel = require('./price.model');
const PriceProvider = require('./price.provider');
const Exception = require('../../shared/exception');
const config = require('../../shared/config');
const utl = require('../../shared/utl');
const appUtl = require('../../shared/app-utl');

class PriceService {
    static async getLatestPrices(symbol) {
        const masSymbolLength = config.getNumber('SYMBOL_MAX_LENGTH');
        utl.assert(!!masSymbolLength, 'SYMBOL_MAX_LENGTH must be set in .env');
        if (symbol.length > parseInt(masSymbolLength, 10)) {
            // I prefer parseInt rather than casting to NaN
            throw new Exception('symbol too long', Exception.Code.BAD_REQUEST);
        }

        const { list } = await PriceModel.search({ symbol, itemsPerPage: 1 }); // will return the last one
        if (list.length === 0) {
            throw new Exception(
                `price not found for ${symbol}`,
                Exception.Code.NOT_FOUND
            );
        }

        const priceStalenessThreshold = config.getNumber(
            'PRICE_STALENESS_THRESHOLD_SECONDS'
        );
        if (Date.now() - list[0].created.getTime() >
            priceStalenessThreshold * 1000
        ) {
            throw new Exception(
                `price is stale for ${symbol}`,
                Exception.Code.NOT_FOUND
            );
        }

        return list[0].entitize();
    }

    static async triggerSync() {
        // On-demand execution
        await PriceProvider.fetchAndStorePrices();
    }

    static startPriceSync() {
        const intervalSeconds = config.getNumber(
            'PRICE_SYNC_INTERVAL_SECONDS',
            30
        );
        const intervalMs = intervalSeconds * 1000;

        const run = async () => {
            try {
                appUtl.log.info(`price sync job started at ${new Date()}`);
                await this.triggerSync();
            } catch (err) {
                // We catch here so the scheduler doesn't die on a single API error
                appUtl.log.error(`price Sync Job Failed: ${err.message}`);
            } finally {
                // Schedule the next run ONLY after the current one is finished
                setTimeout(run, intervalMs);
            }
        };

        // Start the first execution
        void run();
    }
}

module.exports = PriceService;
