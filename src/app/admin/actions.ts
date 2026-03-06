'use server';

import { createClient } from '@supabase/supabase-js';
import { CURRICULUM } from '@/lib/curriculum';

export async function verifyAdminPassword(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return password === correctPassword;
}

export async function seedCurriculumAction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    return { success: false, error: 'Missing environment variables' };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Delete all existing curriculum items before seeding new ones
  await supabaseAdmin.from('curriculum').delete().neq('id', 'placeholder-to-delete-all');

  const { data, error } = await supabaseAdmin
    .from('curriculum')
    .upsert(CURRICULUM);

  if (error) {
    console.error('Error seeding curriculum:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

async function checkIsAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function saveCurriculumItemAction(item: any) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Sanitize item: ensure numbers are numbers and sub_module_id is a valid UUID or null
    const sanitized = {
      ...item,
      week: parseInt(item.week) || 1,
      lecture_index: parseInt(item.lecture_index) || 1,
      required_focus_hours: parseFloat(item.required_focus_hours) || 0,
      required_read_minutes: parseInt(item.required_read_minutes) || 0,
      sub_module_id: (item.sub_module_id && item.sub_module_id !== '') ? item.sub_module_id : null
    };

    // If it's a new item or index changed, we might need to shift
    // For simplicity in this update, we'll just upsert.
    // Index shifting logic can be complex without a transaction, so we'll do a simple upsert first.

    const { data, error } = await supabaseAdmin
      .from('curriculum')
      .upsert(sanitized)
      .select();

    if (error) throw error;

    return { success: true, data: data?.[0] };
  } catch (err: any) {
    console.error('Save Curriculum Error:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function saveModuleAction(module: any) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('modules')
    .upsert(module)
    .select();

  return { success: !error, data: data?.[0], error };
}

export async function deleteModuleAction(id: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('modules').delete().eq('id', id);

  return { success: !error, error };
}

async function authorizeAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const { createServerActionClient } = await import('@supabase/auth-helpers-nextjs');
  const { cookies } = await import('next/headers');

  // Need to await cookies in Next.js 16/App Router
  const cookieStore = await cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function uploadImageAction(formData: FormData) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Simple check for now. Ideally, we would verify a session token or use Supabase Auth middleware.
  // Since this is a server action, it's already slightly more secure than a public API.

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const { data, error } = await supabaseAdmin.storage
    .from('curriculum-images')
    .upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('curriculum-images')
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}

export async function uploadVideoAction(formData: FormData) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const { data, error } = await supabaseAdmin.storage
    .from('curriculum-videos')
    .upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('curriculum-videos')
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}

export async function saveSubModuleAction(subModule: any) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('sub_modules')
    .upsert(subModule)
    .select();

  return { success: !error, data: data?.[0], error };
}

export async function deleteSubModuleAction(id: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('sub_modules').delete().eq('id', id);

  return { success: !error, error };
}

export async function deleteCurriculumItemAction(id: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('curriculum').delete().eq('id', id);

  return { success: !error, error };
}
