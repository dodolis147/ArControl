
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ignsgphnmyppimwvjhbc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nuCKxiQP5S0vW2d9wOX-cQ_IvmRzgUz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
