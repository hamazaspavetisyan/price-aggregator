const appUtl = require('../shared/app-utl');

const addHandler = function (func, permissions, params, isRaw) {
    const endpointCall = appUtl.endpoint(async (req, res) => {
        let session = null;

        req.baseUrl.split('/').pop();

        if (params) {
            const verifiedParams = {};

            for (const key of Object.keys(params)) {
                verifiedParams[key] = await params[key].validate(req[key]);
            }

            verifiedParams.headers = req.headers;
            const result = await func(verifiedParams, session, req, res);
            if (!isRaw) {
                appUtl.jsonOutHandler(null, result, res);
            }
        } else {
            const result = await func(req, res, session);
            if (!isRaw) {
                appUtl.jsonOutHandler(null, result, res);
            }
        }
    });

    return (req, res) => endpointCall(req, res);
};

module.exports = {
    addHandler
};
