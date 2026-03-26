'use client';

import { DeepWorkTimer } from '@/components/timer';
import { FocusHistory } from '@/components/focus-history';
import { useTheme } from '@/components/theme-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function TimerPage() {
  const { theme } = useTheme();

  return (
    <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Deep Work Chamber</h1>
            <p className="text-muted-foreground mt-2">Zero distractions. Just you and the code.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <DeepWorkTimer />
            </div>

            <div className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-sm font-bold flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-primary" />
                     Focus Rules
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <ul className="text-xs space-y-3 text-muted-foreground list-disc pl-4">
                     <li>No phone notifications.</li>
                     <li>No social media tabs.</li>
                     <li>Single task focus.</li>
                     <li>Timer pauses if you leave this tab.</li>
                   </ul>
                 </CardContent>
               </Card>

               {theme === 'pro' && (
                 <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
                   <p className="text-[10px] uppercase font-bold text-primary tracking-widest">
                     Experimental: Binaural Beats Active
                   </p>
                 </div>
               )}

               <FocusHistory />
            </div>
          </div>
        </div>
    </div>
  );
}
