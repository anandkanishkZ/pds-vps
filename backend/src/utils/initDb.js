import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import config from '../config.js';
import { User } from '../models/index.js';

dotenv.config();

const {
  DB_HOST = config.db.host,
  DB_PORT = String(config.db.port),
  DB_USER = config.db.user,
  DB_PASS = config.db.pass,
  DB_NAME = config.db.name,
  DB_SSL = config.db.ssl ? 'true' : 'false',
} = process.env;

export async function ensureDatabaseExists() {
  const client = new pg.Client({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    database: 'postgres',
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    const check = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (check.rowCount === 0) {
      console.log(`[initDb] Creating database "${DB_NAME}"...`);
      await client.query(`CREATE DATABASE "${DB_NAME}" WITH ENCODING 'UTF8' TEMPLATE template1`);
      console.log(`[initDb] Database "${DB_NAME}" created.`);
    } else {
      console.log(`[initDb] Database "${DB_NAME}" already exists.`);
    }
  } finally {
    await client.end();
  }
}

export async function seedAdminUser() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pds.local';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
  const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'admin' });
    console.log(`[initDb] Seeded admin user ${ADMIN_EMAIL}`);
  }
}

export default ensureDatabaseExists;
