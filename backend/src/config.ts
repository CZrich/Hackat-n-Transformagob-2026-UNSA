export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/conecta-unsa',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'conecta-unsa-dev-secret',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },
  allowedDomain: process.env.ALLOWED_DOMAIN || '@unsa.edu.pe',
};
