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

  const { data, error } = await supabaseAdmin
    .from('curriculum')
    .upsert(CURRICULUM);

  if (error) {
    console.error('Error seeding curriculum:', error);
    return { success: false, error };
  }

  return { success: true, data };
}
