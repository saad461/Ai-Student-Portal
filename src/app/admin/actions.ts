'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

  const { data, error } = await supabaseAdmin
    .from('curriculum')
    .upsert(CURRICULUM.map(item => ({ ...item, module_index: 1 })));

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

export async function saveResourceAction(resource: any) {
  const isAdmin = await authorizeAdmin();
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return { success: false, error: 'Missing environment variables' };
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabaseAdmin
    .from('resources')
    .upsert(resource)
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

export async function saveDailyChallengeAction(challenge: any) {
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

export async function saveCourseAction(course: any) {
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

  // If email is not in profiles (legacy or different structure), try auth.users
  // But profiles is our source of truth for students.

  if (userError || !userData) {
    // If profiles doesn't have email, we might need to join or assume ID for now.
    // Based on schema, profiles doesn't have email. It's in auth.users.
    // Let's assume the admin provides the student name or we search differently.
    // Usually we have student_id available from the students list.
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
          // Handle cookie setting errors
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
