// ══════════════════════════════════════════
// supabase-client.js — Inicialización Supabase
// Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
// con los valores de tu proyecto en supabase.com
// ══════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
