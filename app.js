const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRouter');

// declare express
const app = express();

// static files
app.use(express.static(path.join(__dirname, 'public')));

// security http headers
app.use(helmet());

// limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Terlalu banyak request dari IP ini, coba lagi dalam satu jam !',
});
app.use('/api', limiter);

// body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// data sanitization against XSS
app.use(xss());

// prevent parameter polution
app.use(hpp());

// routes
app.use('/api/v1/users', userRouter);

// handling undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this server`, 404));
});

// global error handler
app.use(globalErrorHandler);

module.exports = app;
