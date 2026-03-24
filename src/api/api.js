const appUtl = require('../shared/app-utl');

/**
 * API Routes Configuration
 * Centralizes all API route definitions and registration
 */
const routes = {
    prices: require('./routes/price')
};

/**
 * Initialize and register all API routes with the Express application
 *
 * Routes are automatically mounted under /api/{route-name}/
 * Example: prices route becomes /api/prices/
 *
 * @param {Express.Application} app - Express application instance
 */
const initialize = (app) => {
    appUtl.log.info('Initializing API routes...');

    // Middleware placeholder for future cross-cutting concerns
    app.use((req, res, next) => {
        next();
    });

    // Register all routes dynamically
    Object.keys(routes).forEach((route) => {
        const routePath = `/api/${route}/`;
        app.use(routePath, routes[route]);
        appUtl.log.debug(`Registered route: ${routePath}`);
    });

    appUtl.log.info(
        `API routes initialized: ${Object.keys(routes).length} route(s)`
    );
};

module.exports = {
    initialize
};
