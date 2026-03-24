const utl = require('../../shared/utl');
const appUtl = require('../../shared/app-utl');
const Exception = require('../../shared/exception');
const config = require('../../shared/config');
const axios = require('axios');
const PriceModel = require('./price.model');

/**
 * Price Provider Service
 * Handles fetching cryptocurrency prices from external data providers (CoinGecko)
 * and storing them in the database
 */
class PriceService {
    /**
     * Fetches cryptocurrency prices from CoinGecko API and stores them in MongoDB
     *
     * Process:
     * 1. Fetches top N cryptocurrencies by market cap (excluding USDT)
     * 2. For each cryptocurrency, fetches ticker data from top exchanges
     * 3. Calculates average price across exchanges
     * 4. Stores price data with exchange metadata in database
     *
     * @returns {Promise<void>}
     */
    static async fetchAndStorePrices() {
        try {
            appUtl.log.info('starting price collection pipeline...');
            const dataProviderUrl = config.getString('DATA_PROVIDER_URL');
            const topCurrenciesLimit = config.getNumber('TOP_CURRENCIES_LIMIT');

            // Validate configuration
            utl.assert(
                utl.valid.url(dataProviderUrl),
                'data provider url is required'
            );
            utl.assert(
                topCurrenciesLimit > 0,
                'TOP_CURRENCIES_LIMIT must be greater than 0'
            );

            appUtl.log.debug(
                `fetching top ${topCurrenciesLimit} cryptocurrencies by market cap`
            );

            // Step 1: Get top N coins by market cap
            // Fetching an additional result to account for Tether's high market cap,
            // which will be filtered out in the next step to maintain the top N non-Tether assets
            const coinsRes = await axios.get(`${dataProviderUrl}/markets`, {
                params: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page: parseInt(topCurrenciesLimit + 1, 10),
                    page: 1
                }
            });

            // Filter out USDT and limit to top N
            const allTopCoins = coinsRes.data
                .filter((c) => c.symbol !== 'USDT')
                .slice(0, topCurrenciesLimit);

            appUtl.log.info(
                `found ${allTopCoins.length} cryptocurrencies to process`
            );

            // Step 2: Process each cryptocurrency
            for (const coin of allTopCoins) {
                appUtl.log.debug(`processing ${coin.symbol} (${coin.name})`);

                // Fetch tickers for this coin to find top exchanges
                const tickerRes = await axios.get(
                    `${dataProviderUrl}/${coin.id}/tickers`
                );

                // Filter for valid USDT pairs and sort by volume to get top exchanges
                const topTickers = tickerRes.data.tickers
                    .filter(
                        (t) =>
                            t.last > 0 && // Valid price
                            t.is_stale === false && // Recent data
                            (t.base === 'USDT' || t.target === 'USDT') // USDT pair
                    )
                    .sort((a, b) => b.volume - a.volume) // Sort by volume descending
                    .slice(
                        0,
                        parseInt(config.getNumber('TOP_EXCHANGES_COUNT'), 10)
                    );

                // Skip coins with no valid tickers
                if (topTickers.length === 0) {
                    appUtl.log.warn(
                        `no valid USDT tickers found for ${coin.symbol}, skipping`
                    );
                    continue;
                }

                // Step 3: Calculate average price across exchanges
                const avgPrice =
                    topTickers.reduce((acc, curr) => acc + curr.last, 0) /
                    topTickers.length;

                appUtl.log.debug(
                    `${coin.symbol}: avg price ${avgPrice.toFixed(2)} from ${topTickers.length} exchanges`
                );

                // Step 4: Persist to database
                await PriceModel.create({
                    symbol: coin.symbol,
                    name: coin.name,
                    averagePrice: avgPrice,
                    sources: topTickers.map((t) => ({
                        exchange: t.market.name,
                        price: t.last,
                        volume: t.volume,
                        lastUpdated: t.last_fetch_at
                    }))
                });

                appUtl.log.info(
                    `successfully stored price data for ${coin.symbol}`
                );
            }

            appUtl.log.info('price collection completed successfully');
        } catch (error) {
            appUtl.log.error(`price pipeline error: ${error.message}`);
            // In production, you might implement retry logic or alerts here
            throw new Exception(error.message, error?.status || Exception.Code.SYSTEM); // Re-throw to allow caller to handle
        }
    }
}

module.exports = PriceService;
