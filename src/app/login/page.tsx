'use client';

import { UnifiedLoginForm } from '@/components/unified-login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <UnifiedLoginForm />

        <div className="text-center space-y-4">
          <p className="text-sm text-slate-500 font-medium">
            New to the Daurix Project?{' '}
            <Link href="/enroll" className="text-blue-500 hover:text-blue-400 font-black uppercase tracking-widest text-[10px] transition-colors">
              Initialize Enrollment
            </Link>
          </p>
          <Link href="/" className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-slate-400 transition-colors">
            ← Return to Interface
          </Link>
        </div>
      </div>
    </div>
  );
}
