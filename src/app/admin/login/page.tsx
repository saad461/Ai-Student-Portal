'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { verifyAdminPassword } from '../actions';
import { safeEncode, safeDecode } from '@/lib/auth-utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_remember');
    if (saved) {
      const decoded = safeDecode(saved);
      if (decoded) {
        setPassword(decoded);
        setRememberMe(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isValid = await verifyAdminPassword(password);

    if (isValid) {
      if (rememberMe) {
        localStorage.setItem('admin_remember', safeEncode(password));
      } else {
        localStorage.removeItem('admin_remember');
      }
      router.push('/admin');
    } else {
      setError('Invalid admin password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 text-white border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">Daurix Admin</CardTitle>
          <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Access management controls.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm bg-red-900/50 text-red-200 border border-red-800 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                className="bg-slate-700 border-slate-600 text-white"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 py-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer text-slate-300">
                Remember me
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
