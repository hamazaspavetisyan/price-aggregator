const Exception = require('./exception');
const utl = require('./utl');

class ParamsImpl {
    constructor() {
        if (ParamsImpl.externalValidators === undefined) {
            ParamsImpl.addExternals();
        }

        this._required = {};
        this._optional = {};
    }

    static addExternals() {
        ParamsImpl.externalValidators = {};
        // this.external('currency', 'modules/misc/misc.validator', 'isCurrency');
        // this.external('payemntID', 'modules/payment/paymentid', 'isPaymentID');
    }

    static external(typeName, validatorModule, functionName) {
        if (ParamsImpl.externalValidators[typeName] !== undefined) {
            throw new Exception(
                `Shortcut ${typeName} is registered twice`,
                Exception.Code.SYSTEM
            );
        }

        if (!utl.valid.str(typeName) || typeName.length === 0) {
            throw new Exception(
                `Invalid short type ${typeName}`,
                Exception.Code.BAD_REQUEST
            );
        }

        let validator = require('../' + validatorModule); // This is ugly and need to be done properly
        if (typeof validator[functionName] !== 'function') {
            throw new Exception(
                `Validator ${validatorModule} does not provide function ${functionName}`,
                Exception.Code.SYSTEM
            );
        }

        ParamsImpl.externalValidators[typeName] = validator[functionName];
    }

    static getValidatorFor(type) {
        if (ParamsImpl.externalValidators[type] !== undefined) {
            return ParamsImpl.externalValidators[type];
        }

        if (utl.valid.str(type) && typeof utl.valid[type] === 'function') {
            return utl.valid[type];
        } else {
            throw new Exception(
                `Invalid type ${type}`,
                Exception.Code.BAD_REQUEST
            );
        }
    }

    required(name, type, ...params) {
        if (this._required[name]) {
            throw new Exception(
                `Parameter ${name} is registered twice`,
                Exception.Code.SYSTEM
            );
        }

        if (!utl.valid.str(type) || type.length === 0) {
            throw new Exception(
                `Invalid parameter type for ${name}`,
                Exception.Code.BAD_REQUEST
            );
        }

        this._required[name] = {
            validator: ParamsImpl.getValidatorFor(type),
            params: params
        };

        return this;
    }

    optional(name, type, defValue, ...params) {
        if (this._optional[name]) {
            throw new Exception(
                `Parameter ${name} is registered twice`,
                Exception.Code.SYSTEM
            );
        }

        if (!utl.valid.str(type) || type.length === 0) {
            throw new Exception(
                `Invalid parameter type for ${name}`,
                Exception.Code.BAD_REQUEST
            );
        }

        this._optional[name] = {
            validator: ParamsImpl.getValidatorFor(type),
            params: params,
            default: defValue
        };

        return this;
    }

    async validate(object) {
        if (!utl.valid.object(object)) {
            throw new Exception(
                'Invalid parameter type',
                Exception.Code.BAD_REQUEST
            );
        }

        const result = {};

        const required = {};
        for (const k in this._required) {
            required[k] = this._required[k];
            result[k] = object[k];
        }

        const optional = {};
        for (const k in this._optional) {
            optional[k] = this._optional[k];
            if (object[k] !== undefined) {
                result[k] = object[k];
            } else {
                if (this._optional[k].default !== undefined) {
                    result[k] = this._optional[k].default;
                }
            }
        }

        for (const key in object) {
            if (required[key] === undefined && optional[key] === undefined) {
                throw new Exception(
                    `Unexpected parameter ${key}`,
                    Exception.Code.BAD_REQUEST
                );
            }
        }

        for (const key in required) {
            if (object[key] === undefined) {
                throw new Exception(
                    `Missing parameter ${key}`,
                    Exception.Code.BAD_REQUEST
                );
            }
        }

        for (const key in result) {
            let typeValidator = null;
            let typeValidatorParams = null;

            if (required[key] !== undefined) {
                typeValidator = this._required[key].validator;
                typeValidatorParams = this._required[key].params;
                delete required[key];
            }

            if (optional[key] !== undefined) {
                typeValidator = this._optional[key].validator;
                typeValidatorParams = this._optional[key].params;
                delete optional[key];
            }

            if (
                !(
                    typeValidator &&
                    (await typeValidator(result[key], ...typeValidatorParams))
                )
            ) {
                throw new Exception(
                    `${key} type check failed`,
                    Exception.Code.BAD_REQUEST
                );
            }
        }

        return result;
    }
}

module.exports = () => new ParamsImpl();
