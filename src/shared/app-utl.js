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
    let httpStatus = 200; // Default

    if (err) {
        if (err instanceof Exception) {
            response = {error: err.message};
            logger.error(err.message);
            httpStatus = err.code;
        } else if (err instanceof Error) {
            response = {error: err.toString()};
            logger.error(err.toString());

            logger.error(err.name);
            logger.error(err.stack);
            httpStatus = Exception.Code.SYSTEM;
        } else if (typeof err === 'string') {
            response = {error: err};
            logger.error(err);
            httpStatus = Exception.Code.UNKNOWN_FROM_STRING;
        } else {
            response = new Exception('Unknown error', Exception.Code.UNKNOWN);
            logger.error(err);
            httpStatus = Exception.Code.UNKNOWN;
        }
    } else {
        response = result;
    }

    out.status(httpStatus).json(response);
};

module.exports.endpoint = (fn) => (req, res) => {
    Promise.resolve(fn(req, res)).catch((err) => {
        this.jsonOutHandler(err, res, res);
    });
};
