const PriceService = require('./price.service');

function getLatestPrices(params) {
    const { symbol } = params.query;
    return PriceService.getLatestPrices(symbol);
}

function triggerManualSync() {
    return PriceService.triggerSync();
}

module.exports = {
    getLatestPrices,
    triggerManualSync
};
