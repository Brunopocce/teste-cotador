import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase Project credentials from supabase.com
// Since I cannot create the project for you, these are placeholders.
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);