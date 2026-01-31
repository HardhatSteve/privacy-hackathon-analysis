export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.response) {
    return res.status(err.response.status).json({
      error: err.response.data.message || 'Range API error',
      details: err.response.data
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
};
