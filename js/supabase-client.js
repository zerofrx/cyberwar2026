// ══════════════════════════════════════════
// supabase-client.js — Inicialización Supabase
// Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
// con los valores de tu proyecto en supabase.com
// ══════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL      = 'https://vbfcjynfptozszykjhul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fVZVKguiv7XsVbJuXOfB6A_Ca0Iu3fB';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
