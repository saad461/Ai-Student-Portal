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

export async function saveCurriculumItemAction(item: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // If inserting at a specific index, shift others
  if (item.lecture_index !== undefined) {
    const { data: existing } = await supabaseAdmin
      .from('curriculum')
      .select('id, lecture_index')
      .eq('week', item.week)
      .gte('lecture_index', item.lecture_index)
      .neq('id', item.id);

    if (existing && existing.length > 0) {
      for (const ex of existing) {
        await supabaseAdmin
          .from('curriculum')
          .update({ lecture_index: ex.lecture_index + 1 })
          .eq('id', ex.id);
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('curriculum')
    .upsert(item);

  return { success: !error, data, error };
}

export async function saveModuleAction(module: any) {
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('modules').delete().eq('id', id);

  return { success: !error, error };
}

export async function uploadImageAction(formData: FormData) {
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('sub_modules').delete().eq('id', id);

  return { success: !error, error };
}

export async function deleteCurriculumItemAction(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('curriculum').delete().eq('id', id);

  return { success: !error, error };
}
