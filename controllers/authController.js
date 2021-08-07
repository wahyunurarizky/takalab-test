/* eslint-disable arrow-body-style */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // that we cookie cannot modified anyway in browser. to prevent cross ss attavck xss
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // menghilangkan dari output. ini tidak akan merubah database karena kta tidak melakukan save
  user.password = undefined;
  user.passwordConfirm = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // sign(payload,secret,option) membuat token
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // basic desctructuring
  const { email, password } = req.body;
  // if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  const user = await User.findOne({ where: { email } });
  // jika tidak ada user yg dengan email itu. atau passwordnya tidak sama
  console.log(user.password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401)); //401 is unauthorized
  }
  // send token to the client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check is it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Bearer asdsadaskjsoid aodijasidjaodiaohsidaoh so split sapasi dan get aray 1
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // jika tidak ada token pada authorization header
  if (!token) {
    return next(
      new AppError('you are not logged in, please logini to get access', 401)
    );
  }

  // 2) validate token is valid or not / verification token
  // promisify untuk membuat function menjadi promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // decoded = { id: '606834ffaafb1932b8a83c08', iat: 1617444009, exp: 1620036009 }

  // 3) check if user still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError('The user belonging to this token does not exist', 401)
    );

  // 4) check if user changed password after the jwt was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password, please login again', 401)
    );
  }

  // bisa akses ke protected route
  req.user = freshUser;
  res.locals.user = freshUser;
  // ini sangat penting karena req.user bisa digunakan kedepannya
  next();
});

// cek apakah req.user.role diizinkan untuk mengakses request
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have a permission to perform this action', 403)
      );
    }
    next();
  };
};
