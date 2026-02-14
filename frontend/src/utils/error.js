export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred') => {
    // Axios error response
    const errorData = error?.response?.data;
    if (errorData?.error) return errorData.error;

    // Express-validator style recursive/nested errors
    if (errorData?.errors && Array.isArray(errorData.errors)) {
        return errorData.errors.map(err => `${err.param || err.path || 'Error'}: ${err.msg}`).join(', ');
    }

    // Normal Error message or Axios error message
    if (errorData?.message) return errorData.message;
    if (error?.message) return error.message;

    return defaultMessage;
};
