const mongoose = require('../../shared/mongoose-ex');
const utl = require('../../shared/utl');

const PriceSourceSchema = mongoose.Schema({
    exchange: { type: String, required: true },
    price: { type: Number, required: true },
    volume: { type: Number },
    lastUpdated: { type: Date }
});

const PriceSchema = mongoose.Schema({
    symbol: { type: String, required: true, index: true }, // e.g., 'btc'
    name: { type: String, required: true },
    pair: { type: String, default: 'usd' },
    averagePrice: { type: Number, required: true },
    sources: [PriceSourceSchema] // Metadata about top 3 exchanges
    // timestamps will be crated automatically, see mongoose-ex
});

PriceSchema.statics.search = async function ({
    page = 1,
    itemsPerPage = 10,
    symbol
}) {
    let query = {};
    if (utl.valid.str(symbol)) {
        query.symbol = symbol.toLowerCase();
    }

    const list = await this.find(query)
        .sort({ created: -1 }) // _id also can be used for sorting
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);

    const total = await this.countDocuments(query);
    return { list, total };
};
/*
PriceSchema.methods.entitize = function () {
    return {
        id: this.id.toString(),
        symbol: this.symbol,
        name: this.name,
        averagePrice: this.averagePrice,
        sources: this.sources,
        created: this.created
    };
};
*/
const Price = mongoose.model('Price', PriceSchema);
module.exports = Price;
