import * as fs from 'fs';
import * as path from 'path';

function readKey(filename: string): string {
  const filePath = path.resolve(process.cwd(), 'keys', filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return process.env[`JWT_${filename.replace('.pem', '').toUpperCase()}`] || '';
  }
}

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/conecta-unsa',
  },
  jwt: {
    privateKey: readKey('private.pem'),
    publicKey: readKey('public.pem'),
    expiration: process.env.JWT_EXPIRATION || '7d',
  },
  allowedDomain: process.env.ALLOWED_DOMAIN || '@unsa.edu.pe',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
