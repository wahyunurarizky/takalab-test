'use strict';

const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }

    toJSON() {
      return {
        ...this.get(),
        id: undefined,
        password: undefined,
      };
    }

    async correctPassword(candidatePassword, userPassword) {
      return await bcrypt.compare(candidatePassword, userPassword);
    }
  }
  User.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: { msg: 'masukkan email yang valid' },
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user',
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'password' },
          min: {
            args: 8,
            msg: 'minimum password 8 character',
          },
        },
      },
      passwordConfirm: {
        type: DataTypes.STRING,
        validate: {
          isSame(value) {
            if (this.password !== value) throw new Error('password not match');
          },
        },
      },
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
    }
  );
  User.beforeSave(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 12);
      user.passwordConfirm = undefined;
    }
  });

  return User;
};
