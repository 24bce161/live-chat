import multer from 'multer';

/**
 * 404 for any route that doesn't exist
 */
export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
};

/**
 * Central error handler. Controllers just throw (or call next(error)) and
 * this turns the error into a clean { message } response with the right status code.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  if (err.name === 'ValidationError') {
    // Mongoose schema validation failed — show the first problem
    statusCode = 400;
    message = Object.values(err.errors)[0].message;
  } else if (err.name === 'CastError') {
    // e.g. an invalid ObjectId in the URL
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    // Unique index violation
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'name') message = 'Username is already taken';
    else if (field === 'email') message = 'Email is already registered';
    else message = 'That value is already in use';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10MB)' : err.message;
  }

  if (statusCode === 500) {
    console.error(err);
    // Don't leak internal error details to users in production
    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong, please try again';
    }
  }

  res.status(statusCode).json({ message });
};
