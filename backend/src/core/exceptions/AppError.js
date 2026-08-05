class AppError extends Error {
    /**
     * Standardized application error.
     * @param {string} message - Human readable error message
     * @param {number} statusCode - HTTP status code
     * @param {boolean} isOperational - Is this a trusted/expected error?
     */
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
