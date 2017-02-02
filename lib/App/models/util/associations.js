export function belongsToManyThrough (source, through, target) {
  const foreignKey = `${source.name.toLowerCase()}Id`;
  source.belongsToMany(target, {
    through: {model: through, unique: false},
    foreignKey
  });
}

export function hasManyThrough ({source, target, through, foreignKeyName}) {
  source.belongsToMany(target, {
    through: {
      model: through,
      unique: false,
      scope: {
        [foreignKeyName]: source.name.toLowerCase()
      }
    },
    foreignKey: `${foreignKeyName}Id`,
    constraints: false
  });

  // FIXME: very bad
  // not compatible with adding more to default scope
  source.addScope('defaultScope', {
    include: [target]
  }, {override: true});
}
