const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey|| !supabaseServiceKey) {
  console.warn('Warning: SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_KEY is missing.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);


module.exports = { supabase, supabaseService };
