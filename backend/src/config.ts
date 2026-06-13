export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.SUPABASE_ANON_KEY || 'mock-anon-key',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'mock-service-key',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'conecta-unsa-dev-secret',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },
  allowedDomain: process.env.ALLOWED_DOMAIN || '@unsa.edu.pe',
};
