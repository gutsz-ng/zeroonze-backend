const { Model, DataTypes } = require("sequelize");

/**
 * Model da tabela "users".
 *
 * Repare que os campos são os mesmos da migration. A migration CRIA a
 * tabela no banco; o model diz ao JavaScript como ela é, para poder usá-la.
 */
module.exports = (sequelize) => {
  class User extends Model {}

  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
      timestamps: true,
      // SEGURANÇA: por padrão, toda busca de usuário vem SEM a senha.
      // Assim é impossível devolver o hash numa resposta por descuido.
      defaultScope: { attributes: { exclude: ["password"] } },
      // Quando realmente precisamos da senha (no login), pedimos este "escopo":
      // User.scope("withPassword").findOne(...)
      scopes: { withPassword: { attributes: { include: ["password"] } } },
    }
  );

  return User;
};
