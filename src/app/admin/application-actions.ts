'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function approveApplication(applicationId: string) {
  try {
    // 1. Get application data
    const { data: app, error: getError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (getError || !app) throw new Error('Application not found');

    // 2. Generate credentials
    const password = Math.random().toString(36).substring(2, 10);
    const loginPin = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: `${app.first_name} ${app.last_name}` }
    });

    if (authError) throw authError;

    // 4. Create Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      full_name: `${app.first_name} ${app.last_name}`,
      first_name: app.first_name,
      last_name: app.last_name,
      gender: app.gender,
      cnic: app.cnic,
      age: app.age,
      phone_number: app.phone_number,
      passport_url: app.passport_url,
      skills_level: app.skills_level,
      objective: app.objective,
      education: app.education,
      city: app.city,
      github_link: app.github_link,
      course_pin: app.course_pin,
      login_pin: loginPin,
      role: 'student'
    });

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    // 5. Update Application Status and link to student profile
    await supabaseAdmin
      .from('applications')
      .update({
        status: 'approved',
        student_id: authUser.user.id
      })
      .eq('id', applicationId);

    return {
      success: true,
      credentials: {
        email: app.email,
        password: password,
        loginPin: loginPin
      }
    };

  } catch (err) {
    const errorObj = err as Error;
    console.error('Approve error:', errorObj);
    return { success: false, error: errorObj.message };
  }
}

export async function getApplications() {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function rejectApplication(applicationId: string) {
  const { error } = await supabaseAdmin
    .from('applications')
    .update({ status: 'rejected' })
    .eq('id', applicationId);

  if (error) throw error;
  return { success: true };
}
