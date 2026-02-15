'use server';

export async function verifyAdminPassword(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return password === correctPassword;
}
