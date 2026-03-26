'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CURRICULUM, CurriculumItem } from '@/lib/curriculum';

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

  // 1. Create Web Dev Course
  const { data: webDevCourse } = await supabaseAdmin
    .from('courses')
    .upsert({ slug: 'web-dev', name: 'Web Development', index: 1 })
    .select()
    .single();

  if (!webDevCourse) return { success: false, error: 'Failed to create web dev course' };

  // 2. Create other courses as placeholders
  await supabaseAdmin.from('courses').upsert([
    { slug: 'cyber-security', name: 'Cyber Security', index: 2 },
    { slug: 'ethical-hacking', name: 'Ethical Hacking', index: 3 },
    { slug: 'gen-ai', name: 'Gen AI / Agentic AI', index: 4 },
    { slug: 'ai-masterclass', name: 'AI Masterclass', index: 5 },
  ]);

  // 3. Create initial module linked to web-dev
  const { data: webDevMod } = await supabaseAdmin
    .from('modules')
    .upsert({
       course_id: webDevCourse.id,
       index: 1,
       name: 'HTML Foundation',
       description: 'Foundations of web development with HTML.'
    })
    .select()
    .single();

  if (!webDevMod) return { success: false, error: 'Failed to create web dev module' };

  // Delete all existing curriculum items before seeding new ones
  await supabaseAdmin.from('curriculum').delete().neq('id', 'placeholder-to-delete-all');

  const { error } = await supabaseAdmin
    .from('curriculum')
    .upsert(CURRICULUM.map(item => ({ ...item, module_index: 1 })));

  if (error) {
    console.error('Error seeding curriculum:', error);
    return { success: false, error };
  }

  return { success: true };
}


export async function saveCurriculumItemAction(item: Partial<CurriculumItem>) {
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
      week: typeof item.week === 'string' ? parseInt(item.week) : (item.week || 1),
      lecture_index: typeof item.lecture_index === 'string' ? parseInt(item.lecture_index) : (item.lecture_index || 1),
      required_focus_hours: typeof item.required_focus_hours === 'string' ? parseFloat(item.required_focus_hours) : (item.required_focus_hours || 0),
      required_read_minutes: typeof item.required_read_minutes === 'string' ? parseInt(item.required_read_minutes) : (item.required_read_minutes || 0),
      sub_module_id: (item.sub_module_id && item.sub_module_id !== '') ? item.sub_module_id : null
    };

    const { data, error } = await supabaseAdmin
      .from('curriculum')
      .upsert(sanitized)
      .select();

    if (error) throw error;

    return { success: true, data: data?.[0] };
  } catch (err: unknown) {
    console.error('Save Curriculum Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function saveModuleAction(module: Record<string, unknown>) {
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

  return { success: !error, data: data?.[0] as Record<string, unknown>, error };
}

export async function reviewSubmissionAction(submissionId: string, feedback: string, score: number, status: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .update({
      ai_feedback: feedback,
      ai_score: score,
      ai_status: status,
      status: status === 'passed' ? 'reviewed' : 'extra_task_assigned'
    })
    .eq('id', submissionId)
    .select();

  if (!error && data?.[0]) {
    await createNotificationAction(
      data[0].student_id,
      'Submission Reviewed',
      `Your assignment has been reviewed with a score of ${score}/100.`,
      status === 'passed' ? 'success' : 'warning'
    );
  }

  return { success: !error, data: data?.[0] as Record<string, unknown>, error };
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

export async function logActivityAction(type: string, details: Record<string, unknown> = {}, url?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return { success: false };

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('student_activity')
    .insert({
      student_id: user.id,
      activity_type: type,
      details,
      page_url: url
    });

  return { success: !error };
}

export async function createNotificationAction(studentId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'achievement' = 'info') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({
      student_id: studentId,
      title,
      message,
      type
    });

  return { success: !error, error };
}

export async function uploadResourceFileAction(formData: FormData) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const { error } = await supabaseAdmin.storage
    .from('library-resources')
    .upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('library-resources')
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl, fileName: file.name };
}

export async function rewardStudentAction(amount: number, reason: string, sourceType: string, sourceId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  let validatedAmount = amount;

  if (sourceType === 'attendance') validatedAmount = 10;
  if (sourceType === 'daily_bounty') validatedAmount = Math.min(amount, 50);
  if (sourceType === 'game') validatedAmount = Math.min(amount, 10);

  const { data: profileData } = await supabaseAdmin.from('profiles').select('total_points, xp_booster_until').eq('id', user.id).single();
  if (profileData?.xp_booster_until && new Date(profileData.xp_booster_until) > new Date()) {
    validatedAmount *= 2;
    reason += " (2x Booster Active)";
  }

  const { data: existing } = await supabaseAdmin
    .from('reward_log')
    .select('id')
    .eq('student_id', user.id)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .single();

  if (existing) return { success: true, alreadyRewarded: true };

  const { error: logError } = await supabaseAdmin.from('reward_log').insert({
    student_id: user.id,
    amount: validatedAmount,
    reason,
    source_type: sourceType,
    source_id: sourceId
  });

  if (logError) return { success: false, error: logError.message };

  const { error: profileError } = await supabaseAdmin.rpc('increment_points', {
    user_id: user.id,
    amount: validatedAmount
  });

  if (profileError) {
    console.warn('increment_points RPC failed, falling back to manual update', profileError);
    await supabaseAdmin
      .from('profiles')
      .update({ total_points: (profileData?.total_points || 0) + validatedAmount })
      .eq('id', user.id);
  }

  return { success: true, alreadyRewarded: false };
}

export async function purchaseShopItemAction(itemId: string, priceInSkillPoints: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabaseAdmin.from('profiles').select('total_points').eq('id', user.id).single();
  const costInXp = priceInSkillPoints * 10;

  if (!profile || (profile.total_points || 0) < costInXp) {
    return { success: false, error: 'Insufficient points' };
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ total_points: profile.total_points - costInXp })
    .eq('id', user.id);

  if (profileError) return { success: false, error: profileError.message };

  const { data: existingPerk } = await supabaseAdmin
    .from('user_perks')
    .select('*')
    .eq('user_id', user.id)
    .eq('perk_id', itemId)
    .single();

  if (existingPerk) {
    await supabaseAdmin.from('user_perks').update({
      quantity: (existingPerk.quantity || 1) + 1
    }).eq('id', existingPerk.id);
  } else {
    await supabaseAdmin.from('user_perks').insert({
      user_id: user.id,
      perk_id: itemId,
      quantity: 1
    });
  }

  if (itemId === 'xp_booster') {
     const boosterEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
     await supabaseAdmin.from('profiles').update({ xp_booster_until: boosterEnd }).eq('id', user.id);
  }

  if (itemId === 'streak_freeze') {
     await supabaseAdmin.from('profiles').update({ has_streak_freeze: true }).eq('id', user.id);
  }

  return { success: true };
}

export async function saveResourceAction(resource: Record<string, unknown>) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('resources')
    .upsert({
      ...resource,
      file_path: (resource.external_url as string)?.includes('library-resources') ? resource.external_url : resource.file_path
    })
    .select();

  return { success: !error, data: data?.[0] as Record<string, unknown>, error };
}

export async function deleteResourceAction(id: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('resources').delete().eq('id', id);

  return { success: !error, error };
}

export async function saveDailyChallengeAction(challenge: Record<string, unknown>) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('daily_challenges')
    .upsert(challenge)
    .select();

  return { success: !error, data: data?.[0] as Record<string, unknown>, error };
}

export async function saveCourseAction(course: Record<string, unknown>) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('courses')
    .upsert(course)
    .select();

  return { success: !error, data: data?.[0] as Record<string, unknown>, error };
}

export async function deleteCourseAction(id: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('courses').delete().eq('id', id);

  return { success: !error, error };
}

export async function unlockCourseForStudentAction(email: string, courseId: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: userData, error: userError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'Student not found. Please use the student ID.' };
  }

  const { error } = await supabaseAdmin
    .from('user_courses')
    .upsert({ user_id: userData.id, course_id: courseId, status: 'unlocked' });

  return { success: !error, error };
}

async function authorizeAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
        }
      },
    },
  });

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

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const { error } = await supabaseAdmin.storage
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
  const { error } = await supabaseAdmin.storage
    .from('curriculum-videos')
    .upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('curriculum-videos')
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}

export async function saveSubModuleAction(subModule: Record<string, unknown>) {
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

  return { success: !error, data: data?.[0] as Record<string, unknown>, error };
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
