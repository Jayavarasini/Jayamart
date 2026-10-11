// Central error handler so every route reports failures consistently.
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong on the JayaMart server',
  });
}

module.exports = { notFound, errorHandler };
