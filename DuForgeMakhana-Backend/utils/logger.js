/**
 * Logger Utility - Centralized error and info logging
 * This captures all important events for monitoring after deployment
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  // Error logging - for critical issues
  error: (title, data = {}) => {
    const errorLog = {
      type: '❌ ERROR',
      title,
      timestamp: getTimestamp(),
      ...data,
      environment: process.env.NODE_ENV || 'development'
    };
    console.error(JSON.stringify(errorLog));
    return errorLog;
  },

  // Warning logging - for potential issues
  warn: (title, data = {}) => {
    const warnLog = {
      type: '⚠️ WARNING',
      title,
      timestamp: getTimestamp(),
      ...data
    };
    console.warn(JSON.stringify(warnLog));
    return warnLog;
  },

  // Info logging - for important events
  info: (title, data = {}) => {
    const infoLog = {
      type: 'ℹ️ INFO',
      title,
      timestamp: getTimestamp(),
      ...data
    };
    console.log(JSON.stringify(infoLog));
    return infoLog;
  },

  // Database errors
  dbError: (operation, error, data = {}) => {
    return logger.error('DATABASE_ERROR', {
      operation,
      errorMessage: error.message,
      errorStack: error.stack,
      ...data
    });
  },

  // API errors
  apiError: (endpoint, method, statusCode, error, data = {}) => {
    return logger.error('API_ERROR', {
      endpoint,
      method,
      statusCode,
      errorMessage: error.message || error,
      ...data
    });
  },

  // Authentication errors
  authError: (action, error, userId = null) => {
    return logger.error('AUTH_ERROR', {
      action,
      errorMessage: error.message || error,
      userId
    });
  },

  // Payment errors
  paymentError: (action, error, transactionId = null) => {
    return logger.error('PAYMENT_ERROR', {
      action,
      errorMessage: error.message || error,
      transactionId
    });
  }
};

export default logger;
