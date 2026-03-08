'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Captcha } from '@/components/captcha';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { safeEncode, safeDecode } from '@/lib/auth-utils';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    pin: '',
  });

  useEffect(() => {
    const savedData = localStorage.getItem('login_remember');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData({
          email: safeDecode(parsed.e),
          password: safeDecode(parsed.p),
          pin: safeDecode(parsed.pin),
        });
        setRememberMe(true);
      } catch (e) {
        console.error('Error loading remembered credentials', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Email/Password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Verify Login Pin from Profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('login_pin')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // If it's an admin, they might not have a pin in the profile record if it was created differently
        // But for students, we must check the pin.
        // Let's check the role.
        const { data: roleCheck } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (roleCheck?.role === 'admin') {
           router.push('/dashboard');
           return;
        }

        await supabase.auth.signOut();
        throw new Error('Security verification failed. Profile not found.');
      }

      if (profile.login_pin && profile.login_pin !== formData.pin) {
        await supabase.auth.signOut();
        throw new Error('Invalid Security PIN. Please check your credentials.');
      }

      if (rememberMe) {
        localStorage.setItem('login_remember', JSON.stringify({
          e: safeEncode(formData.email),
          p: safeEncode(formData.password),
          pin: safeEncode(formData.pin)
        }));
      } else {
        localStorage.removeItem('login_remember');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold uppercase tracking-tight">Student Portal</CardTitle>
          <CardDescription>Enter your credentials and security PIN to continue.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md flex items-center gap-2 border border-destructive/20">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
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
              <div className="flex justify-between items-center">
                <Label htmlFor="pin">Security PIN</Label>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">6-Digit Pin</span>
              </div>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="******"
                required={formData.email !== ''} // Make it required for login
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer">
                Remember me
              </Label>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label className="text-xs text-center block text-muted-foreground">Security Check</Label>
              <div className="flex justify-center">
                <Captcha onVerify={setIsCaptchaVerified} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-12 text-lg font-bold uppercase" disabled={loading || !isCaptchaVerified}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...
                </>
              ) : (
                'Secure Login'
              )}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              New student?{' '}
              <Link href="/enroll" className="text-primary hover:underline font-bold">
                Enroll Now
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
