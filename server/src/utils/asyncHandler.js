/**
 * Wraps an async route handler so any thrown error goes to the error middleware.
 * Saves writing try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
