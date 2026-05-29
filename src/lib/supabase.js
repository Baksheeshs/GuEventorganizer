import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials missing. Please update .env.local with your Supabase URL and Anon Key.\n' +
    'Get them from: Supabase Dashboard → Settings → API'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Test Supabase connection — logs status to browser console.
 * Called automatically on app start.
 */
export async function testConnection() {
  try {
    const start = performance.now();
    const { data, error, count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: false })
      .limit(1);

    const ms = Math.round(performance.now() - start);

    if (error) {
      console.error('❌ Supabase connection FAILED:', error.message);
      return false;
    }

    // Also check clubs to verify seed data
    const { count: clubCount } = await supabase
      .from('clubs')
      .select('id', { count: 'exact', head: true });

    const { count: venueCount } = await supabase
      .from('venues')
      .select('id', { count: 'exact', head: true });

    console.log(
      `%c✅ Supabase Connected Successfully! (${ms}ms)`,
      'color: #10b981; font-weight: bold; font-size: 14px;'
    );
    console.log(
      `%c📊 Database Status:` +
      `\n   • Events:  ${data?.length > 0 ? '✅' : '⚠️'} (${count || 0} rows)` +
      `\n   • Clubs:   ${clubCount > 0 ? '✅' : '⚠️'} (${clubCount || 0} rows)` +
      `\n   • Venues:  ${venueCount > 0 ? '✅' : '⚠️'} (${venueCount || 0} rows)` +
      `\n   • URL: ${supabaseUrl}`,
      'color: #6366f1; font-size: 12px;'
    );
    return true;
  } catch (err) {
    console.error('❌ Supabase connection FAILED:', err);
    return false;
  }
}

// Auto-run connection test on app load
testConnection();

/**
 * Upload a file to Supabase Storage and return its public URL.
 * @param {string} bucket - Storage bucket name (e.g., 'event-posters')
 * @param {string} path - File path within the bucket (e.g., 'event-1/poster.jpg')
 * @param {File} file - The file to upload
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within the bucket
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}
