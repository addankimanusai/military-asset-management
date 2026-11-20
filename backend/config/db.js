import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'military_assets',
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle client:', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = () => client.release();
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('[DATABASE] A client has been checked out for more than 5 seconds!');
  }, 5000);

  const releaseWrapper = () => {
    clearTimeout(timeout);
    client.release();
  };

  return {
    ...client,
    query,
    release: releaseWrapper,
  };
};

export default {
  query,
  getClient,
  pool,
};
