const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
  `postgres://postgres:1234@localhost:5432/takalab`
);
