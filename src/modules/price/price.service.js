const PriceModel = require('./price.model');
const PriceProvider = require('./price.provider');
const Exception = require('../../shared/exception');
const config = require('../../shared/config');
const utl = require('../../shared/utl');
const appUtl = require('../../shared/app-utl');

/**
 * Price Service
 * Business logic layer for cryptocurrency price operations
 * Handles price retrieval, validation, and synchronization scheduling
 */
class PriceService {
    /**
     * Retrieves the latest price data for a given cryptocurrency symbol
     *
     * Validates:
     * - Symbol length (security check)
     * - Price exists in database
     * - Price is not stale (based on configured threshold)
     *
     * @param {string} symbol - Cryptocurrency symbol (e.g., BTC, ETH)
     * @returns {Promise<Object>} Latest price data with exchange information
     * @throws {Exception} If symbol is invalid, not found, or price is stale
     */
    static async getLatestPrices(symbol) {
        appUtl.log.debug(`retrieving latest price for symbol: ${symbol}`);

        // Validate symbol length to prevent potential attacks or invalid queries
        const masSymbolLength = config.getNumber('SYMBOL_MAX_LENGTH');
        utl.assert(!!masSymbolLength, 'SYMBOL_MAX_LENGTH must be set in .env');
        if (symbol.length > parseInt(masSymbolLength, 10)) {
            appUtl.log.warn(
                `symbol too long: ${symbol} (max: ${masSymbolLength})`
            );
            throw new Exception('symbol too long', Exception.Code.BAD_REQUEST);
        }

        // Query database for the most recent price entry
        const { list } = await PriceModel.search({ symbol, itemsPerPage: 1 });
        if (list.length === 0) {
            appUtl.log.warn(`price not found for symbol: ${symbol}`);
            throw new Exception(
                `price not found for ${symbol}`,
                Exception.Code.NOT_FOUND
            );
        }

        // Check if price data is fresh (not stale)
        const priceStalenessThreshold = config.getNumber(
            'PRICE_STALENESS_THRESHOLD_SECONDS'
        );
        const ageSeconds = (Date.now() - list[0].created.getTime()) / 1000;
        if (ageSeconds > priceStalenessThreshold) {
            appUtl.log.warn(
                `price is stale for ${symbol}: ${ageSeconds.toFixed(0)}s old (threshold: ${priceStalenessThreshold}s)`
            );
            throw new Exception(
                `price is stale for ${symbol}`,
                Exception.Code.NOT_FOUND
            );
        }

        appUtl.log.info(`successfully retrieved latest price for ${symbol}`);
        return list[0].entitize();
    }

    /**
     * Manually trigger price synchronization
     * Fetches and stores latest prices for all tracked cryptocurrencies
     *
     * @returns {Promise<void>}
     */
    static async triggerSync() {
        appUtl.log.info('triggering on-demand price synchronization');
        await PriceProvider.fetchAndStorePrices();
        appUtl.log.info('on-demand price synchronization completed');
    }

    /**
     * Starts the automatic price synchronization scheduler
     *
     * Runs continuously with configured interval between executions.
     * Each sync waits for completion before scheduling the next run.
     * Errors are caught and logged to prevent scheduler from stopping.
     *
     * @returns {void}
     */
    static startPriceSync() {
        const intervalSeconds = config.getNumber(
            'PRICE_SYNC_INTERVAL_SECONDS',
            30
        );
        const intervalMs = intervalSeconds * 1000;

        appUtl.log.info(
            `starting price sync scheduler with ${intervalSeconds}s interval`
        );

        const run = async () => {
            try {
                appUtl.log.info(
                    `price sync job started at ${new Date().toISOString()}`
                );
                await this.triggerSync();
                appUtl.log.info('price sync job completed successfully');
            } catch (err) {
                // Catch errors to prevent scheduler from dying on API failures
                appUtl.log.error(`price sync job failed: ${err.message}`);
            } finally {
                // Schedule next run ONLY after current execution finishes
                // This prevents overlapping executions if sync takes longer than interval
                appUtl.log.debug(
                    `next price sync scheduled in ${intervalSeconds}s`
                );
                setTimeout(run, intervalMs);
            }
        };

        // Start the first execution immediately
        void run();
    }
}

module.exports = PriceService;
