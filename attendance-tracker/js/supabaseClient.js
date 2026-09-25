// supabaseClient.js — creates the single shared Supabase client.
// Loaded straight from a CDN as an ES module, so there is still no build step
// and the site still works on GitHub Pages.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export function isConfigured() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    !SUPABASE_PUBLISHABLE_KEY.includes('REPLACE_ME')
  );
}

export const supabase = isConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;
