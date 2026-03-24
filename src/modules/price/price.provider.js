const utl = require('../../shared/utl');
const appUtl = require('../../shared/app-utl');
const config = require('../../shared/config');
const axios = require('axios');
const PriceModel = require('./price.model');

class PriceService {
    static async fetchAndStorePrices() {
        try {
            appUtl.log.info('starting price collection pipeline...');
            const dataProviderUrl = config.getString('DATA_PROVIDER_URL');
            const topCurrenciesLimit = config.getNumber('TOP_CURRENCIES_LIMIT');
            utl.assert(
                utl.valid.url(dataProviderUrl),
                'data provider url is required'
            );
            utl.assert(
                topCurrenciesLimit > 0,
                'TOP_CURRENCIES_LIMIT must be greater than 0'
            );

            // 1. Get Top 5 Coins by Market Cap
            const coinsRes = await axios.get(
                `${dataProviderUrl}/markets`, // better to move fragment to config
                {
                    params: {
                        vs_currency: 'usd',
                        order: 'market_cap_desc',
                        //Fetching an additional result to account for Tether's high market cap, which will be filtered out in the next step to maintain the top 5 non-Tether assets.
                        per_page: parseInt(topCurrenciesLimit + 1, 10),
                        page: 1
                    }
                }
            );

            const allTopCoins = coinsRes.data
                .filter((c) => c.symbol !== 'USDT')
                .slice(0, topCurrenciesLimit);
            for (const coin of allTopCoins) {
                // 2. Get tickers for each coin to find top exchanges
                const tickerRes = await axios.get(
                    `${dataProviderUrl}/${coin.id}/tickers` // better to move path to config
                );

                // Filter for valid prices and sort by volume to get top
                const topTickers = tickerRes.data.tickers
                    .filter(
                        (t) =>
                            t.last > 0 &&
                            t.is_stale === false &&
                            (t.base === 'USDT' || t.target === 'USDT')
                    )
                    .sort((a, b) => b.volume - a.volume)
                    .slice(
                        0,
                        parseInt(config.getNumber('TOP_EXCHANGES_COUNT'), 10)
                    );

                if (topTickers.length === 0) continue;

                const avgPrice =
                    topTickers.reduce((acc, curr) => acc + curr.last, 0) /
                    topTickers.length;

                // 3. Persist
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
            }
            appUtl.log.info('price collection completed successfully.');
        } catch (error) {
            appUtl.log.error(`price pipeline error: ${error.message}`);
            // In a production env, you might implement a retry or alert here
        }
    }
}

module.exports = PriceService;
