import Promise from 'bluebird';
import {find as findOne} from 'lodash';

export const manageRoles = {
  findAndAddRole (roleName) {
    const Role = this.Model.sequelize.models.Role;
    return Role.findOrCreate({where: {name: roleName}})
      .spread((role) => this.addRole(role))
      .then(() => this.reload());
  },

  findAndSetRoles (roleNames) {
    const Role = this.Model.sequelize.models.Role;

    return Role.findAll({where: {name: {$in: roleNames}}}).then(function (roles) {
      return Promise.map(roleNames, function (roleName) {
        const foundRole = findOne(roles, {name: roleName});
        if (foundRole) { return Promise.resolve(foundRole); }
        return Role.create({name: roleName});
      });
    })

    .then((roles) => this.setRoles(roles))
    .then(() => this.reload());
  }
};
