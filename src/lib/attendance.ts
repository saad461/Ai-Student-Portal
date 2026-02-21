import { supabase } from './supabase';

export async function markAttendance(userId: string) {
  try {
    const today = new Date().toLocaleDateString('en-CA');

    // 1. Check if already punched in to avoid duplicates (though DB has unique constraint)
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      return { success: true, alreadyMarked: true };
    }

    // 2. Get profile for streak/points calculation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, total_points, last_punch_in')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // 3. Record in attendance table
    const { error: attendanceError } = await supabase.from('attendance').insert({
      student_id: userId,
      date: today
    });

    if (attendanceError) throw attendanceError;

    // 4. Calculate new streak
    let newStreak = 1;
    if (profile.last_punch_in) {
      const lastPunch = new Date(profile.last_punch_in);
      const todayDate = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isConsecutive = lastPunch.toDateString() === yesterday.toDateString();
      const isToday = lastPunch.toDateString() === todayDate.toDateString();

      if (isConsecutive) {
        newStreak = (profile.current_streak || 0) + 1;
      } else if (isToday) {
        newStreak = profile.current_streak || 1;
      }
    }

    // 5. Update profile with points and streak
    const { error: profileUpdateError } = await supabase.from('profiles').update({
      current_streak: newStreak,
      total_points: (profile.total_points || 0) + 10,
      last_punch_in: new Date().toISOString()
    }).eq('id', userId);

    if (profileUpdateError) throw profileUpdateError;

    return { success: true, alreadyMarked: false };
  } catch (err) {
    console.error('Error marking attendance:', err);
    return { success: false, error: err };
  }
}
