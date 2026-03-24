/**
 * Application Error Codes
 * Standardized HTTP and custom error codes used throughout the application
 *
 * HTTP Standard Codes (4xx, 5xx):
 * - Client errors (400-499): Bad requests, authentication, authorization, not found
 * - Server errors (500-599): Internal errors, service unavailable
 *
 * Custom Application Codes (551-801):
 * - Database, validation, network, and business logic errors
 */
const ErrorCode = {
    // HTTP 4xx - Client Errors
    BAD_REQUEST: 400, // Invalid request parameters
    UNAUTHORIZED: 401, // Authentication required
    NO_ACCESS: 403, // Forbidden - authenticated but not authorized
    NOT_FOUND: 404, // Resource not found
    API_NOT_FOUND: 404, // API endpoint not found
    EXISTS: 409, // Resource already exists (conflict)
    TOO_MANY_REQUESTS: 429, // Rate limit exceeded

    // HTTP 5xx - Server Errors
    TERMS: 511, // Terms of service violation
    SERVICE_UNAVAILABLE: 503, // Service temporarily unavailable

    // Custom Application Codes (5xx range)
    DB: 551, // Database operation error
    VALIDATION: 552, // Data validation error
    SYSTEM: 553, // General system error
    UNKNOWN: 555, // Unknown error
    UNKNOWN_FROM_STRING: 556, // Error parsing from string
    NETWORK: 557, // Network/connectivity error
    RPC: 558, // Remote procedure call error
    NEED_VERIFICATION_VIA_EMAIL: 559, // Email verification required

    // Authentication/Authorization Extensions
    TFA: 801 // Two-factor authentication required
};

/**
 * Custom Exception Class
 * Standardized error handling for the application
 *
 * Usage:
 *   throw new Exception('Resource not found', Exception.Code.NOT_FOUND, { id: 123 });
 */
class Exception {
    /**
     * Creates a new Exception instance
     *
     * @param {string} message - Human-readable error message
     * @param {number} code - Error code from ErrorCode enum
     * @param {Object} [data] - Optional additional error context/metadata
     */
    constructor(message, code, data) {
        this.message = message;
        this.code = code;

        if (data) {
            this.data = data;
        }
    }
}

// Attach ErrorCode enum to Exception class for easy access
Exception.Code = ErrorCode;

module.exports = Exception;
