import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  try {
    console.log('[DB SEED] Executing seed.sql...');
    const seedSql = fs.readFileSync(path.resolve(__dirname, '../models/seed.sql'), 'utf-8');
    await db.query(seedSql);
    console.log('[DB SEED] Seed data populated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[DB SEED] Error running seed:', err);
    process.exit(1);
  }
}

runSeed();
