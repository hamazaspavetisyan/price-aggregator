const Mongoose = require('mongoose').Mongoose;
const mongoose = new Mongoose();

const appUtl = require('./app-utl');
const config = require('../shared/config');

/**
 * MongoDB Connection Configuration
 *
 * This module sets up a Mongoose instance with custom configurations:
 * - Automatic connection to MongoDB
 * - Global plugin for entitize() method on all schemas
 * - Automatic timestamps (created, updated) on all schemas
 * - Indexes on timestamp fields for query performance
 */

// MongoDB connection configuration
const mongoHost = config.getString('MONGODB_URI');
const mongoDb = config.getString('MONGODB_DATABASE_NAME');
const mongoOptions = {}; // Reserved for future authentication/connection options

const url = `${mongoHost}/${mongoDb}`;

// Connection error handler
mongoose.connection.on('error', function (err) {
    appUtl.log.error(`cannot connect to MongoDB: ${err.message}`);
});

// Connection success handler
mongoose.connection.once('open', function () {
    appUtl.log.debug(`connection to database established: ${url}`);
});

// Disable mongoose debug mode (set to true for development debugging)
mongoose.set('debug', false);

// Establish connection
if (mongoOptions.authData) {
    mongoose.connect(url, mongoOptions.authData);
} else {
    mongoose.connect(url);
}

/**
 * Global Mongoose Plugin
 * Applied to all schemas automatically
 *
 * Adds:
 * 1. entitize() method - Converts Mongoose document to clean JSON object
 * 2. Automatic timestamps - created and updated fields
 * 3. Indexes on timestamp fields for efficient sorting/filtering
 */
mongoose.plugin(function (schema) {
    // Add entitize() method if not already defined
    if (!schema.methods.entitize) {
        /**
         * Converts Mongoose document to clean entity object
         * - Removes internal __v field
         * - Renames _id to id
         * - Optionally removes specified fields
         *
         * @param {...string} fieldsToRemove - Fields to exclude from result
         * @returns {Object} Clean entity object
         */
        schema.methods.entitize = function () {
            const args = Array.from(arguments);
            const res = this.toObject({ virtuals: true });

            // Remove Mongoose version key
            delete res['__v'];

            // Normalize ID field
            res['id'] = res['_id'];
            delete res['_id'];

            // Remove any additional specified fields
            for (const item of args) {
                delete res[item];
            }

            return res;
        };
    }

    // Add automatic timestamps to all schemas
    schema.set('timestamps', { createdAt: 'created', updatedAt: 'updated' });

    // Add indexes for efficient timestamp queries
    schema.index({ created: -1 });
    schema.index({ updated: -1 });
});

module.exports = mongoose;
