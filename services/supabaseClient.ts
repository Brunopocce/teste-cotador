import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const supabaseUrl = 'https://ijganwbaoxqbivqkqnxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZ2Fud2Jhb3hxYml2cWtxbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTE4NzYsImV4cCI6MjA3OTc4Nzg3Nn0.y3PFg6EtAauVmOol3fbIjsydxAJEPlRlB_mxDowOmX4';

export const supabase = createClient(supabaseUrl, supabaseKey);