const ErrorCode = {
    BAD_REQUEST: 400,
    API_NOT_FOUND: 404,
    NOT_FOUND: 404,
    NO_ACCESS: 403,
    UNAUTHORIZED: 401,
    TOO_MANY_REQUESTS: 429,
    DB: 551,
    VALIDATION: 552,
    SYSTEM: 553,
    UNKNOWN: 555,
    UNKNOWN_FROM_STRING: 556,
    NETWORK: 557,
    EXISTS: 409,
    TFA: 801,
    TERMS: 511,
    RPC: 558,
    NEED_VERIFICATION_VIA_EMAIL: 559,
    SERVICE_UNAVAILABLE: 503
};

class Exception {
    constructor(message, code, data) {
        this.message = message;
        this.code = code;

        if (data) {
            this.data = data;
        }
    }
}

Exception.Code = ErrorCode;
module.exports = Exception;
