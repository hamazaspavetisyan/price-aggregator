const fs = require('fs');
const moment = require('moment');
const path = require('path');
const ObjectId = require('mongoose').Types.ObjectId;
const Exception = require('./exception');
const config = require('./config');

function assert(cond, msg) {
    if (!cond) {
        throw new Exception(
            `Assertion failed: ${msg ? ` ${msg}` : ''}`,
            Exception.Code.BAD_REQUEST
        );
    }
}

function capitalizeFirst(str) {
    if (!str) return str; // handle empty string
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function mustNeverReachHere(msg) {
    assert(false, 'Must never reach here: ' + msg);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function arrayUnique(ar) {
    return ar.filter(onlyUnique);
}

function isSet(data) {
    return data !== undefined && data != null;
}

function isObject(data) {
    return isSet(data) && typeof data === 'object';
}

function isValidNumber(data) {
    if (typeof data === 'number' || typeof data === 'string') {
        return isSet(data) && !isNaN(parseFloat(data));
    }
    return false;
}

function isValidEnum(data, values) {
    return isSet(data) && values.indexOf(data) !== -1;
}

function isValidString(data) {
    const isValid =
        isSet(data) && (data || data === '') && typeof data === 'string';
    if (!isValid) {
        return false;
    }

    data = data.trim();

    return data.length > 0;
}

function isValidStringOrEmpty(data) {
    const isValid =
        isSet(data) && (data || data === '') && typeof data === 'string';
    return isValid;
}

function isValidPassword(password) {
    return (
        isValidString(password) &&
        password.length >= 6 &&
        password.length <= 256 &&
        password.match(
            /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[-!@#$%^&*()_+|~=`{}\[\]:";'<>?,.\/0-9a-zA-Z]{6,}$/
        )
    );
}

function isValidBoolean(data) {
    return typeof data === 'boolean' || data === 'true' || data === 'false';
}

function isValidInteger(data) {
    return isValidNumber(data) && Number(data) === parseInt(data, 10);
}

function isValidNonNegativeNumber(data) {
    return (
        isValidNumber(data) &&
        (Number(data) === parseInt(data, 10) ||
            Number(data) === parseFloat(data)) &&
        data >= 0
    );
}

function isValidPositiveNumber(data) {
    return (
        isValidNumber(data) &&
        (Number(data) === parseInt(data, 10) ||
            Number(data) === parseFloat(data)) &&
        data > 0
    );
}

function isValidNonNegativeInteger(data) {
    return (
        isValidNumber(data) && Number(data) === parseInt(data, 10) && data >= 0
    );
}

function isValidPositiveInteger(data) {
    return (
        isValidNumber(data) && Number(data) === parseInt(data, 10) && data > 0
    );
}

function isValidArray(data) {
    return isSet(data) && Array.isArray(data);
}

function isValidIP(data) {
    const matcher =
        /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)$/;
    if (isValidString(data) && data === '::1') {
        return true;
    }

    return isValidString(data) && matcher.test(data);
}

function isValidUrl(data) {
    const urlregex =
        /^((http|https)?):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return isSet(data) && urlregex.test(data);
}

function isValidId(id) {
    if (!isSet(id)) {
        return false;
    }

    return ObjectId.isValid(id);
}

function isValidIdArray(ids) {
    if (!isValidArray(ids)) {
        return false;
    }

    return !ids.map((id) => isValidId(id)).find((id) => id === false);
}

function isValidStrArray(strArray) {
    if (!isValidArray(strArray)) {
        return false;
    }

    return !strArray
        .map((id) => isValidString(id))
        .find((isStr) => isStr === false);
}

function isValidIdOrAny(id) {
    return isValidId(id) || id === 'any' || id === 'ANY' || id === 'null';
}

function isValidDate(data) {
    if (!isSet(data)) return false;

    if (Object.prototype.toString.call(data) === '[object Date]') {
        // it is a date
        if (isNaN(data.getTime())) {
            // d.valueOf() could also work
            // date is not valid
            return false;
        } else {
            // date is valid
            return true;
        }
    } else {
        // not a date
        return false;
    }
}

function isValidTimestamp(data) {
    if (!isValidNonNegativeInteger(data)) {
        return false;
    }

    // 06/06/2050 @ 12:00am (UTC)
    if (parseInt(data, 10) > 2538086400000) {
        return false;
    }

    return true;
}

function isValidDateString(dateString) {
    return moment(dateString, moment.ISO_8601, true).isValid();
}

module.exports.getStringBetween = function (str, start, end) {
    const startIndex = str.indexOf(start);

    if (startIndex === -1) {
        return '';
    }
    const endIndex = str.lastIndexOf(end);
    if (endIndex === -1) {
        return '';
    }

    if (endIndex <= startIndex + 1) {
        return '';
    }

    return str.substring(startIndex + 1, endIndex);
};

module.exports.parseBoolean = (val) => {
    return val === true || val === 'true';
};

module.exports.escapeSpecialChars = function (str) {
    return str
        .replace(/\\n/g, '\\n')
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, '\\&')
        .replace(/\\r/g, '\\r')
        .replace(/\\t/g, '\\t')
        .replace(/\\b/g, '\\b')
        .replace(/\\f/g, '\\f');
};

module.exports.randomInRange = function (minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

module.exports.removeStr = function (text, str) {
    assert(this.valid.str(text), 'invalid text');
    assert(this.valid.str(str), 'invalid str');

    const startIndex = text.indexOf(str);
    const endIndex = startIndex + str.length;
    const a = text.substring(0, startIndex);
    const b = text.substring(endIndex, text.length);

    return a + b;
};

module.exports.injectStrBefore = function (text, needle, str) {
    assert(this.valid.str(text), 'invalid text');
    assert(this.valid.str(needle), 'invalid needle');
    assert(this.valid.str(str), 'invalid str');

    const posIndex = text.indexOf(needle) + needle.length;
    const a = text.substring(0, posIndex);
    const b = text.substring(posIndex, text.length);

    return a + str + b;
};

module.exports.valid = {
    obj: isSet,
    object: isObject,
    enum: isValidEnum,
    password: isValidPassword,
    boolean: isValidBoolean,
    integer: isValidInteger,
    nonNegativeInteger: isValidNonNegativeInteger,
    positiveInteger: isValidPositiveInteger,
    nonNegativeNumber: isValidNonNegativeNumber,
    positiveNumber: isValidPositiveNumber,
    number: isValidNumber,
    array: isValidArray,
    ip: isValidIP,
    id: isValidId,
    idArray: isValidIdArray,
    strArray: isValidStrArray,
    str: isValidString,
    strWithEmpty: isValidStringOrEmpty,
    url: isValidUrl,
    date: isValidDate,
    dateString: isValidDateString,
    idOrAny: isValidIdOrAny,
    timestamp: isValidTimestamp
};

module.exports.clone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

module.exports.assert = assert;

module.exports.capitalizeFirst = capitalizeFirst;

module.exports.mustNeverReachHere = mustNeverReachHere;

module.exports.arrayUnique = arrayUnique;

module.exports.millisecondsPerDay = 24 * 60 * 60 * 1000;

module.exports.sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

module.exports.arrayIntersection = (arrA, arrB) => {
    return arrA.filter((x) => arrB.includes(x));
};

module.exports.arrayDifference = (arrA, arrB) => {
    return arrA.filter((x) => !arrB.includes(x));
};

module.exports.arraysHaveSameContent = (arrA, arrB) => {
    if (
        !Array.isArray(arrA) ||
        !Array.isArray(arrB) ||
        arrA.length !== arrB.length
    ) {
        return false;
    }

    const intersection = this.arrayIntersection(arrA, arrB);
    return intersection.length === arrA.length;
};

module.exports.reverseString = (str) => {
    return str.split('').reverse().join('');
};
