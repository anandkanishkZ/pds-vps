require('dotenv').config();

const common = {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: false,
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
};

module.exports = {
  development: common,
  test: common,
  production: common
};
