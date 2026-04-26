/**
 * Formats a success API response
 * @param {any} data - Response payload
 * @param {string} message - Optional message
 */
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Formats an error API response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 */
const errorResponse = (message, status = 500) => ({
  success: false,
  error: { message, status },
  timestamp: new Date().toISOString(),
});

/**
 * Generates a unique ID using timestamp + random
 */
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Safely parse JSON, return null on failure
 */
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

module.exports = { successResponse, errorResponse, generateId, safeJsonParse };
