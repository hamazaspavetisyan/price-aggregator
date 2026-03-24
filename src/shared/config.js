const dotenv = require('dotenv');
const { join } = require('path');

// Adjust the path if your .env file is located elsewhere
dotenv.config({
    path: join(__dirname, '../../.env')
});

class ConfigService {
    static getString(key, defaultValue = '') {
        return process.env[key] ?? defaultValue;
    }

    static getStringArray(key, delimiter, defaultValue = []) {
        const str = this.getString(key);
        if (!str) return defaultValue;
        return str.split(delimiter);
    }

    static getNumber(key, defaultValue = 0) {
        const value = process.env[key];
        return value ? Number(value) : defaultValue;
    }

    static getBoolean(key, defaultValue = false) {
        const value = process.env[key];
        if (value === undefined) return defaultValue;
        return value === 'true';
    }
}

module.exports = ConfigService;
