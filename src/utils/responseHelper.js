const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    errors: null
  });
};

const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors
  });
};

module.exports = {
  successResponse,
  errorResponse
};
