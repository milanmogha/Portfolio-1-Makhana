import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Base env
dotenv.config();

// Local development overrides (never loaded in production).
// `.env.development` points at local Mongo, enables OTP dev mode, etc.
// Production containers run with NODE_ENV=production, so this block is inert there.
if (process.env.NODE_ENV !== 'production') {
  const devEnvPath = path.resolve(process.cwd(), '.env.development');
  if (fs.existsSync(devEnvPath)) {
    dotenv.config({ path: devEnvPath, override: true });
    console.log('🔧 Loaded .env.development overrides (local dev mode)');
  }
}
