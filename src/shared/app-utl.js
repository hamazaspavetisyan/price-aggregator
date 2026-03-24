const logger = require('./logger');
const Exception = require('./exception');

module.exports.log = logger;

module.exports.httpStream = {
    write: (message) => {
        logger.info(message);
    }
};

module.exports.jsonOutHandler = function (err, result, out) {
    let response;

    if (err) {
        if (err instanceof Exception) {
            response = err;
            logger.error(err.message);
        } else if (err instanceof Error) {
            response = new Exception(err.toString(), Exception.Code.SYSTEM);
            logger.error(err.toString());

            logger.error(err.name);
            logger.error(err.stack);
        } else if (typeof err === 'string') {
            response = new Exception(err, Exception.Code.UNKNOWN_FROM_STRING);
            logger.error(err);
        } else {
            response = new Exception('Unknown error', Exception.Code.UNKNOWN);
            logger.error(err);
        }
    } else {
        response = result;
    }

    out.json(response);
};

module.exports.endpoint = (fn) => (req, res) => {
    Promise.resolve(fn(req, res)).catch((err) => {
        this.jsonOutHandler(err, res, res);
    });
};
