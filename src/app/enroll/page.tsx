'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function EnrollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    cv: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Enrollment failed');

      if (!authData.session) {
        // This usually means email confirmation is enabled
        setError('Enrollment successful! Please check your email to confirm your account before logging in.');
        setLoading(false);
        return;
      }

      // 2. Upload CV (if any)
      let cvUrl = '';
      if (formData.cv) {
        try {
          const fileExt = formData.cv.name.split('.').pop();
          const fileName = `${authData.user.id}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('cvs')
            .upload(fileName, formData.cv);

          if (!uploadError) {
            cvUrl = fileName;
          } else {
            console.warn('CV upload failed:', uploadError.message);
            // We don't throw here to allow enrollment to continue even if CV upload fails
          }
        } catch (e) {
          console.warn('CV upload exception:', e);
        }
      }

      // 3. Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: formData.fullName,
        cv_url: cvUrl,
        enrollment_date: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Enroll in Training Portal</CardTitle>
          <CardDescription>Start your 24-week journey to becoming a Pro Developer.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cv">Upload CV (Optional)</Label>
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFormData({ ...formData, cv: e.target.files?.[0] || null })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enrolling...' : 'Join the Course'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
