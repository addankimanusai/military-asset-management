import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runInit() {
  try {
    console.log('[DB INIT] Executing schema.sql...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../models/schema.sql'), 'utf-8');
    await db.query(schemaSql);
    console.log('[DB INIT] Schema successfully initialized!');
    process.exit(0);
  } catch (err) {
    console.error('[DB INIT] Error running schema:', err);
    process.exit(1);
  }
}

runInit();
