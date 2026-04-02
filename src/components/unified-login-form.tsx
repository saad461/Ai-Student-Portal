'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Captcha } from '@/components/captcha';
import { ShieldAlert, Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';
import { safeEncode, safeDecode } from '@/lib/auth-utils';
import { logActivityAction } from '@/app/admin/actions';

interface ProfileResult {
  login_pin?: string;
  role?: string;
}

export function UnifiedLoginForm({ className }: { className?: string }) {
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
      // 1. Sign in with password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Fetch profile for PIN/Role verification
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('login_pin, role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw new Error('Security verification failed. Profile not found.');

      const profile = profileData as ProfileResult;
      const userRole = profile?.role;
      const userPin = profile?.login_pin;

      // 3. PIN Verification (Skip for Admins)
      if (userRole !== 'admin') {
        if (userPin && userPin !== formData.pin) {
          await supabase.auth.signOut();
          throw new Error('Invalid Security PIN.');
        }
      }

      // 4. Persistence
      if (rememberMe) {
        localStorage.setItem('login_remember', JSON.stringify({
          e: safeEncode(formData.email),
          p: safeEncode(formData.password),
          pin: safeEncode(formData.pin)
        }));
      } else {
        localStorage.removeItem('login_remember');
      }

      // 5. Activity Logging (Optional, but good for tracking)
      try {
        await logActivityAction('login', { method: 'unified_form' }, '/');
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr);
      }

      // 6. Wait a bit for cookies to settle before navigating
      await new Promise(resolve => setTimeout(resolve, 500));

      // 7. Redirect
      router.push('/dashboard');
      router.refresh(); // Ensure session is picked up
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto p-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden group ${className}`}>
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-[80px] group-hover:bg-blue-600/30 transition-colors pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Access Portal</h3>
          <p className="text-slate-400 text-sm font-medium">Identity Verification Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 text-red-400 rounded-xl flex items-center gap-2 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-unified" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Identity (Email)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email-unified"
                type="email"
                placeholder="cadet@daurix.com"
                required
                className="bg-slate-950/50 border-white/5 pl-10 h-12 focus:border-blue-500/50 transition-all text-white rounded-xl"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-unified" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Key (Password)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="password-unified"
                type="password"
                required
                placeholder="••••••••"
                className="bg-slate-950/50 border-white/5 pl-10 h-12 focus:border-blue-500/50 transition-all text-white rounded-xl"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin-unified" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Security PIN</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="pin-unified"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6-Digit PIN"
                required
                className="bg-slate-950/50 border-white/5 pl-10 h-12 focus:border-blue-500/50 transition-all text-white text-center font-mono tracking-[0.3em] rounded-xl"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 cursor-pointer group/check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover/check:text-slate-300 transition-colors">Remember Me</span>
            </label>
            <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Emergency Reset</button>
          </div>

          <div className="pt-2">
            <Captcha onVerify={setIsCaptchaVerified} />
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            disabled={loading || !isCaptchaVerified}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : 'Initiate Session'}
          </Button>
        </form>
      </div>
    </div>
  );
}
