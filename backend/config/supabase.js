import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Crear un cliente de Supabase con las credenciales del archivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar definidos en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
