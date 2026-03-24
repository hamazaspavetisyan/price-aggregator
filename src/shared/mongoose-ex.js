const Mongoose = require('mongoose').Mongoose;
const mongoose = new Mongoose();

const appUtl = require('./app-utl');
const config = require('../shared/config');
const mongoHost = config.getString('MONGODB_URI');
const mongoDb = config.getString('MONGODB_DATABASE_NAME');
const mongoOptions = {}; // skipping now

const url = `${mongoHost}/${mongoDb}`;

mongoose.connection.on('error', function (err) {
    appUtl.log.error(`cannot connect to mongoDB ${err.message}`);
});

mongoose.connection.once('open', function () {
    appUtl.log.debug(`connection to database is established (${url})`);
});

mongoose.set('debug', false);

if (mongoOptions.authData) {
    mongoose.connect(url, mongoOptions.authData);
} else {
    mongoose.connect(url);
}

mongoose.plugin(function (schema) {
    if (!schema.methods.entitize) {
        schema.methods.entitize = function () {
            const args = Array.from(arguments);
            const res = this.toObject({ virtuals: true });
            delete res['__v'];
            res['id'] = res['_id'];
            delete res['_id'];
            for (const item of args) {
                delete res[item];
            }
            return res;
        };
    }

    schema.set('timestamps', { createdAt: 'created', updatedAt: 'updated' }); //add timestamps
    schema.index({ created: -1 });
    schema.index({ updated: -1 });
});

module.exports = mongoose;
