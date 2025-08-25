import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import config from '../config.js';
import { sequelize, User } from '../models/index.js';

dotenv.config();

async function main() {
  try {
    await sequelize.authenticate();
    const email = process.env.ADMIN_EMAIL || 'admin@pds.local';
    const name = process.env.ADMIN_NAME || 'Admin';
    const pass = process.env.ADMIN_PASSWORD || 'admin123';
    let user = await User.findOne({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(pass, config.security.saltRounds);
      user = await User.create({ email, name, passwordHash, role: 'admin' });
      console.log(`Seeded admin: ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

await main();
