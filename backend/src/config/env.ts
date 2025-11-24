import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseServiceKey: string;
  jwtSecret: string;
  nodeEnv: string;
}

function validateEnv(): EnvConfig {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    jwtSecret: process.env.JWT_SECRET!,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

export const env = validateEnv();

