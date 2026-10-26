/**
 * BLENDIFY SUPABASE SERVICE
 * Cloud PostgreSQL Database, Authentication & Object Storage Integration.
 *
 * Designed with dual-tier fallback:
 * - Online / Production: Syncs with live Supabase Auth, PostgreSQL tables, and Storage.
 * - Local / Offline: Gracefully falls back to local SQLite WebAssembly when credentials
 *   are not configured, ensuring zero errors and 100% offline functionality.
 */

import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'blendify_supabase_url';
const STORAGE_KEY_ANON_KEY = 'blendify_supabase_anon_key';

// Read from Vite environment or localStorage override
function getSupabaseUrl() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_URL);
    if (stored && stored.trim()) return stored.trim();
  }
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
}

function getSupabaseAnonKey() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_ANON_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
}

/**
 * Check if valid Supabase credentials are configured
 */
export function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    url !== 'https://your-project-id.supabase.co' &&
    key !== 'your-supabase-anon-key'
  );
}

// Client singleton instance
let supabaseClient = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log('[Blendify Supabase] Client connected to:', getSupabaseUrl());
    } catch (err) {
      console.warn('[Blendify Supabase] Initialization error:', err);
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

/**
 * Configure Supabase credentials at runtime and persist to localStorage
 */
export function configureSupabase(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON_KEY);
  }
  supabaseClient = null; // Reset client singleton
  return getSupabaseClient();
}

/**
 * Get current Supabase status info
 */
export function getSupabaseStatus() {
  const configured = isSupabaseConfigured();
  const url = getSupabaseUrl();
  let projectRef = null;
  if (configured && url) {
    try {
      const parsed = new URL(url);
      projectRef = parsed.hostname.split('.')[0] || null;
    } catch (e) {}
  }
  return {
    configured,
    url: configured ? url : null,
    projectRef,
    services: configured ? ['PostgreSQL Database', 'Authentication', 'Storage (Buckets)'] : []
  };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Sign up a new user with Supabase Auth & insert profile into users table
 */
export async function supabaseSignUp(email, password, displayName, role = 'student') {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      configured: false,
      message: 'Supabase is not configured. Saved to local SQLite database.'
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName,
          role: role
        }
      }
    });

    if (error) throw error;

    // Synchronize to public users table if configured
    if (data.user) {
      try {
        await client.from('users').upsert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          name: displayName,
          role: role,
          updated_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('[Supabase users table upsert warning]', dbErr);
      }
    }

    return {
      success: true,
      configured: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: displayName,
        role: role
      },
      session: data.session
    };
  } catch (error) {
    console.error('[Blendify Supabase] Sign-up error:', error);
    return {
      success: false,
      configured: true,
      code: error.status || error.code,
      message: error.message || 'Failed to sign up with Supabase'
    };
  }
}

/**
 * Sign in user with Supabase Auth
 */
export async function supabaseSignIn(email, password) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      configured: false,
      message: 'Supabase is not configured.'
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) throw error;

    let role = data.user?.user_metadata?.role || 'student';
    let name = data.user?.user_metadata?.display_name || email.split('@')[0];

    // Attempt to read custom profile from users table
    try {
      const { data: profile } = await client
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.name) name = profile.name;
      }
    } catch (e) {
      console.warn('[Supabase profile fetch warning]', e);
    }

    return {
      success: true,
      configured: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name,
        role
      },
      session: data.session
    };
  } catch (error) {
    console.error('[Blendify Supabase] Sign-in error:', error);
    return {
      success: false,
      configured: true,
      code: error.status || error.code,
      message: error.message || 'Failed to authenticate with Supabase'
    };
  }
}

/**
 * Sign out from Supabase
 */
export async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('[Blendify Supabase] Sign-out error:', e);
    }
  }
}

/**
 * Get current session user
 */
export async function getSupabaseUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch (e) {
    return null;
  }
}

// ============================================================================
// DATABASE / POSTGRESQL CRUD
// ============================================================================

/**
 * Fetch all classroom portals from Supabase
 */
export async function supabaseGetPortals() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('classroom_portals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('[Supabase getPortals]', e);
    return null;
  }
}

/**
 * Insert or update a classroom portal in Supabase
 */
export async function supabaseCreatePortal(portal) {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('classroom_portals').upsert({
      tag: portal.tag,
      name: portal.name,
      cohort: portal.cohort,
      description: portal.desc || portal.description || '',
      share_url: portal.url || portal.shareUrl || '',
      learners_count: portal.learners || 0,
      materials_count: portal.materials || 0,
      quizzes_count: portal.quizzes || 0
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase createPortal]', e);
    return false;
  }
}

/**
 * Fetch learning materials from Supabase
 */
export async function supabaseGetMaterials(portalTag = null) {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    let query = client.from('learning_materials').select('*');
    if (portalTag) query = query.eq('portal_tag', portalTag);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('[Supabase getMaterials]', e);
    return null;
  }
}

/**
 * Add a learning material to Supabase
 */
export async function supabaseAddMaterial(mat) {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('learning_materials').insert({
      id: mat.id,
      portal_tag: mat.portalTag,
      title: mat.title,
      category: mat.category,
      size: mat.size,
      status: mat.status || 'Open Access',
      description: mat.desc || '',
      allow_download: mat.allowDownload !== false,
      file_url: mat.fileUrl || null
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase addMaterial]', e);
    return false;
  }
}

/**
 * Record an activity event in Supabase student_activities
 */
export async function supabaseRecordActivity(event) {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('student_activities').insert({
      student_name: event.studentName,
      student_id: event.studentId,
      portal_tag: event.portalTag || null,
      material_name: event.materialName,
      action: event.action,
      action_class: event.actionClass || 'open',
      status_pill: event.statusPill || 'Active Now'
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase recordActivity]', e);
    return false;
  }
}

// ============================================================================
// OBJECT STORAGE (FILE UPLOADS)
// ============================================================================

/**
 * Upload a file to Supabase Storage bucket ('blendify-materials')
 */
export async function supabaseUploadFile(fileOrBlob, destinationPath, bucket = 'blendify-materials') {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      configured: false,
      message: 'Supabase Storage is not configured.'
    };
  }

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(destinationPath, fileOrBlob, {
        upsert: true,
        cacheControl: '3600'
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(destinationPath);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('[Blendify Supabase] Storage upload error:', error);
    return {
      success: false,
      message: error.message || 'File upload failed'
    };
  }
}
