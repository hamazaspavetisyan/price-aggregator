const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { splat, combine, timestamp, printf } = winston.format;

function expandErrors(logger) {
    const oldLogFunc = logger.log;
    logger.log = function () {
        const args = Array.prototype.slice.call(arguments, 0);
        if (args.length >= 2 && args[1] instanceof Error) {
            args[1] = args[1].stack;
        }
        return oldLogFunc.apply(this, args);
    };
    return logger;
}

const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...args } = info;
        return `${level}: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    })
);

const fileFormatter = printf(({ timestamp, level, message, meta }) => {
    return `${timestamp} ${level}: ${message}${meta ? ' - ' + JSON.stringify(meta) : ''}`;
});

const logger = expandErrors(
    winston.createLogger({
        exitOnError: false, //don't crash on exception
        transports: [
            new winston.transports.Console({
                handleExceptions: true,
                prettyPrint: true,
                level: 'silly',
                silent: false,
                timestamp: true,
                colorize: true,
                json: false,
                format: alignedWithColorsAndTime
            }),
            new DailyRotateFile({
                handleExceptions: true,
                prettyPrint: true,
                level: 'info',
                silent: false,
                name: 'file.info',
                filename: '../logs/info-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                json: false,
                timestamp: true,
                split: true,
                format: combine(timestamp(), splat(), fileFormatter)
            }),
            new DailyRotateFile({
                name: 'file.error',
                filename: '../logs/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                handleExceptions: true,
                json: false,
                prettyPrint: true,
                timestamp: true,
                split: true,
                format: combine(timestamp(), splat(), fileFormatter)
            })
        ],
        exceptionHandlers: [
            new winston.transports.File({
                filename: '../logs/exceptions.log',
                format: combine(timestamp(), splat(), fileFormatter)
            })
        ]
    })
);

const stableLevels = Object.keys(logger.levels);
const loggers = {};
for (const levelName of stableLevels) {
    loggers[levelName] = function () {
        return logger[levelName](arguments[0]);
    };
}

const customLevelsJson = require('./logger.json');
const transports = [];
const levels = {};
const customLevels = Object.keys(customLevelsJson);
if (customLevels.length) {
    const colors = {};
    const maxLevelName = customLevels[customLevels.length - 1];
    for (const customLevel of customLevels) {
        colors[customLevel] = customLevelsJson[customLevel].color;
        transports.push(
            new winston.transports.File({
                name: 'file.' + customLevel,
                filename:
                    '../logs/' +
                    customLevelsJson[customLevel].fileName +
                    '.log',
                level: customLevel,
                handleExceptions: false,
                json: false,
                prettyPrint: true,
                timestamp: true,
                format: combine(timestamp(), splat(), fileFormatter)
            })
        );

        levels[customLevel] = customLevelsJson[customLevel].level;

        transports.push(
            new winston.transports.Console({
                handleExceptions: true,
                prettyPrint: true,
                level: /*maxLevelName*/ customLevel,
                silent: false,
                timestamp: true,
                colorize: true,
                json: false,
                format: alignedWithColorsAndTime
            })
        );

        levels[maxLevelName] = customLevelsJson[maxLevelName].level;

        const customLogger = winston.createLogger({
            levels: levels,
            exitOnError: false, //don't crash on exception
            transports: transports
        });

        loggers[customLevel] = function () {
            return customLogger[customLevel](arguments[0]);
        };
    }
    winston.addColors(colors);
}

module.exports = loggers;
