const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { User } = require('../models');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll();

  return res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.getOneUser = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;
  const user = await User.findOne({
    where: { uuid },
  });
  if (!user) return next(new AppError('id not found', 404));
  return res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.updateOneUser = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;
  const user = await User.findOne({ where: { uuid } });
  user.update({ name: req.body.name });

  return res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
