const ApiResponse = require('../core/utils/ApiResponse');

/**
 * Abstract Base Controller
 * Standardizes API responses and provides async error catching wrappers.
 */
class BaseController {
    
    sendResponse(res, data, message = 'Success', statusCode = 200, meta = null) {
        return ApiResponse.success(res, data, message, statusCode, meta);
    }

    sendError(res, error, message = 'An error occurred', statusCode = 500) {
        return ApiResponse.error(res, message, statusCode, error);
    }

    /**
     * Eliminates the need for try/catch blocks in every controller method.
     * Passes caught exceptions to the global error handling middleware.
     */
    catchAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn.bind(this)(req, res, next)).catch(next);
        };
    }
}

module.exports = BaseController;
