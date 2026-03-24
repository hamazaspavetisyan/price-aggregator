const routes = {
    price: require('./routes/price')
};

const initialize = (app) => {
    app.use((req, res, next) => {
        next();
    });
    Object.keys(routes).map((route) => {
        app.use(`/api/${route}/`, routes[route]);
    });
};

module.exports = {
    initialize
};
