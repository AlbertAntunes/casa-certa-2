const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL não definido no .env');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_KEY não definido no .env');
}

if (process.env.SUPABASE_SERVICE_KEY.startsWith('sb_publishable_')) {
  throw new Error('SUPABASE_SERVICE_KEY inválido: use a service_role key do Supabase, não a publishable key.');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = supabase;