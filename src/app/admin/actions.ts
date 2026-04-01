'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CURRICULUM } from '@/lib/curriculum';

export async function verifyAdminPassword(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const isValid = password === correctPassword;

  if (isValid) {
    const cookieStore = await cookies();
    cookieStore.set('admin_access', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 24 hours
    });
  }

  return isValid;
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_access');
  return { success: true };
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

export async function saveCurriculumItemAction(item: Record<string, unknown>) {
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
      week: parseInt(String(item.week)) || 1,
      lecture_index: parseInt(String(item.lecture_index)) || 1,
      required_focus_hours: parseFloat(String(item.required_focus_hours)) || 0,
      required_read_minutes: parseInt(String(item.required_read_minutes)) || 0,
      sub_module_id: (item.sub_module_id && item.sub_module_id !== '') ? item.sub_module_id : null,
      course_id: (item.course_id && item.course_id !== '') ? item.course_id : null,
      module_id: (item.module_id && item.module_id !== '') ? item.module_id : null,
      knowledge_checks: item.knowledge_checks || []
    };

    const { data, error } = await supabaseAdmin
      .from('curriculum')
      .upsert(sanitized)
      .select();

    if (error) throw error;

    return { success: true, data: data?.[0] };
  } catch (err) {
    const error = err as Error;
    console.error('Save Curriculum Error:', error);
    return { success: false, error: error.message || 'Unknown error' };
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

  return { success: !error, data: data?.[0], error };
}

export async function reviewSubmissionAction(
  submissionId: string,
  feedback: string,
  score: number,
  status: string,
  sections?: {
    knowledge_check?: { score: number; feedback: string };
    assignment?: { score: number; feedback: string };
  },
  mistakes?: string[],
  improvements?: string[]
) {
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
      ai_sections: sections,
      ai_mistakes: mistakes,
      ai_improvements: improvements,
      status: status === 'passed' ? 'reviewed' : 'extra_task_assigned'
    })
    .eq('id', submissionId)
    .select();

  if (!error && data?.[0]) {
    const sub = data[0];
    await createNotificationAction(
      sub.student_id,
      'Submission Reviewed',
      `Your assignment has been reviewed with a score of ${score}/100.`,
      status === 'passed' ? 'success' : 'warning'
    );

    // Award Sparks for manual review
    const sparks = Math.floor(score / 20);
    if (sparks > 0 && status === 'passed') {
      const { data: lecture } = await supabaseAdmin.from('curriculum').select('title').eq('id', sub.curriculum_id).single();
      await rewardStudentAction(
        sparks * 10,
        `Lecture Mastery (Manual): ${lecture?.title || 'Unknown'}`,
        'lecture_completion',
        sub.curriculum_id,
        sub.student_id
      );
    }
  }

  return { success: !error, data: data?.[0], error };
}

export async function saveAIReviewAction(
  curriculumId: string,
  review: {
    score: number;
    feedback: string;
    status: string;
    sections: Record<string, unknown>;
    mistakes: string[];
    improvements: string[];
  }
) {
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
        } catch { /* ignore */ }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // 1. Update submission using service role
  const { data: subData, error: subError } = await supabaseAdmin
    .from('submissions')
    .update({
      ai_score: review.score,
      ai_feedback: review.feedback,
      ai_status: review.status,
      ai_sections: review.sections,
      ai_mistakes: review.mistakes,
      ai_improvements: review.improvements,
      status: 'reviewed'
    })
    .eq('student_id', user.id)
    .eq('curriculum_id', curriculumId)
    .select();

  if (subError) return { success: false, error: subError.message };

  // 2. Award Sparks
  const sparks = Math.floor(review.score / 20);
  if (sparks > 0) {
    const { data: lecture } = await supabaseAdmin.from('curriculum').select('title').eq('id', curriculumId).single();
    await rewardStudentAction(
      sparks * 10,
      `Lecture Mastery: ${lecture?.title || 'Unknown'}`,
      'lecture_completion',
      curriculumId
    );
  }

  return { success: true, data: subData?.[0] };
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

export async function getAdminDataAction() {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const [
      { data: profiles },
      { data: courses },
      { data: curriculum },
      { data: modules },
      { data: subModules },
      { data: attendance },
      { data: resources },
      { data: challenges }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*, submissions (*), student_activity (*)'),
      supabaseAdmin.from('courses').select('*').order('index', { ascending: true }),
      supabaseAdmin.from('curriculum').select('*').order('week', { ascending: true }),
      supabaseAdmin.from('modules').select('*').order('index', { ascending: true }),
      supabaseAdmin.from('sub_modules').select('*').order('index', { ascending: true }),
      supabaseAdmin.from('attendance').select('*, profiles(full_name)').order('date', { ascending: false }),
      supabaseAdmin.from('resources').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('daily_challenges').select('*').order('active_date', { ascending: false })
    ]);

    return {
      success: true,
      data: {
        profiles: profiles || [],
        courses: courses || [],
        curriculum: curriculum || [],
        modules: modules || [],
        subModules: subModules || [],
        attendance: attendance || [],
        resources: resources || [],
        challenges: challenges || []
      }
    };
  } catch (err) {
    const error = err as Error;
    console.error('Fetch Admin Data Error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
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
        } catch {
          // ignore
        }
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
    .upload(fileName, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false
    });

  if (error) return { success: false, error: error.message };

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('library-resources')
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl, fileName: file.name };
}

export async function rewardStudentAction(amount: number, reason: string, sourceType: string, sourceId: string, studentId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  let targetStudentId = studentId;

  if (!targetStudentId) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* ignore */ }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    targetStudentId = user.id;
  } else {
    // If studentId is provided, we must be an admin
    const isAdmin = await authorizeAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };
  }

  // Validate allowed reward amounts per source type to prevent console hacking
  let validatedAmount = amount;

  if (sourceType === 'attendance') validatedAmount = 10;
  if (sourceType === 'daily_bounty') validatedAmount = Math.min(amount, 50);
  if (sourceType === 'game') validatedAmount = Math.min(amount, 10);
  if (sourceType === 'lecture_completion') validatedAmount = Math.min(amount, 50); // Max 5 Sparks (50 XP)

  // XP Booster check
  const { data: profileData } = await supabaseAdmin.from('profiles').select('total_points, xp_booster_until').eq('id', targetStudentId).single();
  if (profileData?.xp_booster_until && new Date(profileData.xp_booster_until) > new Date()) {
    validatedAmount *= 2;
    reason += " (2x Booster Active)";
  }

  // 1. Check if already rewarded
  const { data: existing } = await supabaseAdmin
    .from('reward_log')
    .select('id')
    .eq('student_id', targetStudentId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .single();

  if (existing) return { success: true, alreadyRewarded: true };

  // 2. Log reward
  const { error: logError } = await supabaseAdmin.from('reward_log').insert({
    student_id: targetStudentId,
    amount: validatedAmount,
    reason,
    source_type: sourceType,
    source_id: sourceId
  });

  if (logError) return { success: false, error: logError.message };

  // 3. Update profile using SQL increment to prevent race conditions
  const { error: profileError } = await supabaseAdmin.rpc('increment_points', {
    user_id: targetStudentId,
    amount: validatedAmount
  });

  // Fallback if RPC is not defined
  if (profileError) {
    console.warn('increment_points RPC failed, falling back to manual update', profileError);
    await supabaseAdmin
      .from('profiles')
      .update({ total_points: (profileData?.total_points || 0) + validatedAmount })
      .eq('id', targetStudentId);
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
        } catch {
          // ignore
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // 1. Get profile and validate points
  const { data: profile } = await supabaseAdmin.from('profiles').select('total_points').eq('id', user.id).single();
  const costInXp = priceInSkillPoints * 10;

  if (!profile || (profile.total_points || 0) < costInXp) {
    return { success: false, error: 'Insufficient points' };
  }

  // 2. Deduct points
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ total_points: (profile.total_points || 0) - costInXp })
    .eq('id', user.id);

  if (profileError) return { success: false, error: profileError.message };

  // 3. Add to user_perks
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

  // 4. Special immediate effects
  if (itemId === 'xp_booster') {
     const boosterEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
     await supabaseAdmin.from('profiles').update({ xp_booster_until: boosterEnd }).eq('id', user.id);
  }

  if (itemId === 'streak_freeze') {
     await supabaseAdmin.from('profiles').update({ has_streak_freeze: true }).eq('id', user.id);
  }

  if (itemId === 'priority_review') {
     // Mark all currently 'submitted' assignments as priority
     await supabaseAdmin
       .from('submissions')
       .update({ status: 'priority_review' })
       .eq('student_id', user.id)
       .eq('status', 'submitted');
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
      // Ensure file_path is updated if the URL comes from our storage
      file_path: (resource.external_url as string)?.includes('library-resources') ? resource.external_url : resource.file_path
    })
    .select();

  return { success: !error, data: data?.[0], error };
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

  return { success: !error, data: data?.[0], error };
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

  return { success: !error, data: data?.[0], error };
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

  // Find user by email
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
  const cookieStore = await cookies();
  const adminAccess = cookieStore.get('admin_access');
  if (adminAccess?.value === 'true') return true;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;

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
          // ignore
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

export async function fetchChatMessagesAction(studentId: string, adminId: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // We use a more robust query for fetching messages
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .or(`sender_id.eq.${studentId},receiver_id.eq.${studentId}`)
    .order('created_at', { ascending: true });

  // Filter messages to ensure they are between the student and the admin
  const filteredData = data?.filter(msg =>
    (msg.sender_id === studentId && msg.receiver_id === adminId) ||
    (msg.sender_id === adminId && msg.receiver_id === studentId)
  ) || [];

  return { success: !error, data: filteredData, error };
}

export async function sendChatMessageAction(senderId: string, receiverId: string, content: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false
    })
    .select();

  return { success: !error, data: data?.[0], error };
}

export async function sendAutoResponseAction(studentId: string) {
  // Use Service Role to act as Admin
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const adminId = '00000000-0000-0000-0000-000000000000';

  // 1. Check if we already sent an auto-response recently (e.g., in the last 2 hours)
  const { data: recentAuto } = await supabaseAdmin
    .from('chat_messages')
    .select('id')
    .eq('sender_id', adminId)
    .eq('receiver_id', studentId)
    .ilike('content', '%automated message%')
    .gt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (recentAuto && recentAuto.length > 0) return { success: true, skipped: true };

  // 2. Send the auto-response
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      sender_id: adminId,
      receiver_id: studentId,
      content: "Hello! This is an automated message to let you know that we have received your query. An instructor will get back to you as soon as possible. Thank you for your patience!",
      is_read: false
    });

  return { success: !error, skipped: false };
}

export async function markMessagesAsReadAction(studentId: string, adminId: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ is_read: true })
    .eq('sender_id', studentId)
    .eq('receiver_id', adminId)
    .eq('is_read', false);

  return { success: !error, error };
}

export async function updateLastSeenAction() {
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
        } catch {
          // ignore
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id);

  return { success: !error };
}

export async function getUnreadCountsAction(adminId: string) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('sender_id')
    .eq('receiver_id', adminId)
    .eq('is_read', false);

  if (error) return { success: false, error };

  const counts: Record<string, number> = {};
  data?.forEach(msg => {
    counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
  });

  return { success: true, data: counts };
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
