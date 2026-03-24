const PriceService = require('./price.service');

function getLatestPrices(params) {
    const { symbol } = params.body;
    return PriceService.getLatestPrices(symbol);
}

function triggerManualSync() {
    return PriceService.triggerSync();
}

module.exports = {
    getLatestPrices,
    triggerManualSync
};
