class ApiResponse {
    /**
     * Send a standardized successful JSON response.
     */
    static success(res, data, message = 'Success', statusCode = 200, meta = null) {
        const response = {
            success: true,
            message,
            data
        };
        if (meta) {
            response.meta = meta;
        }
        return res.status(statusCode).json(response);
    }

    /**
     * Send a standardized error JSON response.
     */
    static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message
        };
        if (errors) {
            response.errors = errors;
        }
        return res.status(statusCode).json(response);
    }
}

module.exports = ApiResponse;
