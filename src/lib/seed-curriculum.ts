import { supabase } from './supabase';
import { CURRICULUM } from './curriculum';

export async function seedCurriculum() {
  const { data, error } = await supabase
    .from('curriculum')
    .upsert(CURRICULUM);

  if (error) {
    console.error('Error seeding curriculum:', error);
    return { success: false, error };
  }

  return { success: true, data };
}
