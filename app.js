const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const api = require('./src/api/api');
const appUtl = require('./src/shared/app-utl');
const Exception = require('./src/shared/exception');
const PriceService = require('./src/modules/price/price.service');
const loggingEnabled = true;
const RpcNode = require('./src/rpc/rpc-node');
const config = require('./src/shared/config');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

app.use(
    cors({
        origin: '*'
    })
);

app.use(compression({ threshold: 300 }));
app.use(
    morgan('short', {
        stream: appUtl.httpStream,
        skip: () => !loggingEnabled
    })
);

// Define the rate limit rule, all parameters should be moved to .env file
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute in milliseconds
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        message: 'Too many requests, please try again after an hour.'
    },
    // Integration with your existing Exception/Logger logic
    handler: (req, res, next, options) => {
        appUtl.log.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

api.initialize(app);

app.use(function (req, res, next) {
    next(
        new Exception(
            `Not found: ${req.method} ${req.originalUrl}`,
            Exception.Code.NOT_FOUND
        ),
        { IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress }
    );
});

app.use(function (err, req, res, next) {
    console.error('GLOBAL ERROR HANDLER: ' + JSON.stringify(err));
    appUtl.jsonOutHandler(
        err && err instanceof Exception
            ? err
            : err && err.message
              ? err.message
              : err,
        null,
        res
    );
    next();
});

appUtl.log.info('initializing system ..');

app.listen(config.getNumber('LISTENING_PORT'), async () => {
    const port = config.getNumber('LISTENING_PORT');
    appUtl.log.info(`🎧 listening on: ${port}`);

    appUtl.log.info('initializing price service ..');
    PriceService.startPriceSync();

    appUtl.log.info('staring RPC node');
    // 2. Start RPC server in parallel
    const rpcNode = new RpcNode();
    try {
         await rpcNode.start();
    } catch (err) {
        appUtl.log.error('failed to start RPC server:', err);
        process.exit(1);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nshutting down...');
        await rpcNode.stop();
        process.exit(0);
    });
}).on('error', function (err) {
    appUtl.log.error(err.message);
});
