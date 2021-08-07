const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // untuk mendapatkan string didalam quotes wkwkw
  const keys = Object.keys(err.keyValue)[0];
  // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  return new AppError(`${keys} telah digunakan`, 400);
};

const handleValidationErrorDB = (err) => {
  // membuat array yg berisi err.message
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Data input tidak valid: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. please login again', 401);

const handleJWTExpired = () =>
  new AppError('Your token is expired. please login again', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    console.error('ERROR', err);
    res.status(err.statusCode).json({
      success: false,
      code: `${err.statusCode}`,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // console.error('ERROR', err);
    // res.status(err.statusCode).render('main/error', {
    //   title: 'something went wrong',
    //   message: err.message,
    // });
  }
};
const sendErrorProd = (err, req, res) => {
  console.log('test');
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        code: `${err.statusCode}`,
        message: err.message,
        data: null,
      });
    }
    console.error('ERROR', err);

    // programming or other unknown error
    return res.status(500).json({
      success: false,
      code: `${err.statusCode}`,
      message: 'something went very wrong',
      data: null,
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('main/error', {
      title: 'something went wrong',
      msg: err.message,
    });
  }
  // supaya bisa tampil di hosting kita
  console.error('ERROR', err);

  // programming or other unknown error
  return res.status(err.statusCode).render('main/error', {
    title: 'something went wrong',
    msg: 'please try again later',
  });
};

// express will know that is error handling midleware by defining 4 params
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  console.log('ERROORR COKKKK', err);

  if (process.env.NODE_ENV === 'development') {
    // error yang tampil saat development
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // error yang terjadi saat mode production, lebih simpel, agar user tidak bingung dan tidak perlu mengetahui
    // misal object id ngasal
    let error = err;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpired();

    sendErrorProd(error, req, res);
  }
};
