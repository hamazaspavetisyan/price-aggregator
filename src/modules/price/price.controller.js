const PriceService = require('./price.service');
const appUtl = require('../../shared/app-utl');

/**
 * Controller for handling price-related API requests
 */

/**
 * Get the latest price data for a specific cryptocurrency symbol
 * @param {Object} params - Request parameters
 * @param {Object} params.query - Query parameters
 * @param {string} params.query.symbol - Cryptocurrency symbol (e.g., BTC, ETH)
 * @returns {Promise<Object>} Latest price data for the symbol
 */
function getLatestPrices(params) {
    const { symbol } = params.query;
    appUtl.log.info(`fetching latest price for symbol: ${symbol}`);
    return PriceService.getLatestPrices(symbol);
}

/**
 * Manually trigger the price synchronization process
 * Fetches and stores latest prices for all tracked cryptocurrencies
 * @returns {Promise<void>}
 */
function triggerManualSync() {
    appUtl.log.info('manual price sync triggered via API');
    return PriceService.triggerSync();
}

module.exports = {
    getLatestPrices,
    triggerManualSync
};
