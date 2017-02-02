'use strict';

import phone from 'phone';

module.exports = function (sequelize, DataTypes) {
  var Agent = sequelize.define('Agent', {
    govId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isNumeric: true
      }
    },
    companyName: DataTypes.STRING,
    officeName: DataTypes.STRING,
    officeAddress: DataTypes.STRING,
    officeCity: DataTypes.STRING,
    officeProvince: DataTypes.STRING,
    officePhone: {
      type: DataTypes.STRING,
      allowNull: true,
      set: function (val) {
        // leave for validations if cannot format
        let formatted = phone(val)[0] || val;
        this.setDataValue('officePhone', formatted);
      },
      validate: {
        isPhone: function (val) {
          if (!phone(val)[0]) {
            throw new Error(`${val} is not valid`);
          }
        }
      }
    }
  }, {
    classMethods: {
      associate: function (models) {
        models.Agent.belongsTo(models.User);
      }
    }
  });
  return Agent;
};
