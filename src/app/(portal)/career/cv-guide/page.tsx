'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, ArrowLeft, Image as ImageIcon, Layout, ListChecks, Target } from 'lucide-react';
import Link from 'next/link';

export default function CVGuidePage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12 pb-20">
      <header className="space-y-4">
        <Link href="/career">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Career Center
          </Button>
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Building a Pro Developer CV</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Your CV is your first pitch to recruiters. In the tech industry, clarity, impact, and proof of work are what matters most.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-3xl border-2">
           <CardHeader>
              <CardTitle className="flex items-center gap-2 uppercase tracking-tighter">
                 <Layout className="h-6 w-6 text-primary" /> The Perfect Layout
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <p className="text-muted-foreground font-medium">Keep it to <strong>one page</strong> if you have less than 5 years of experience. Use a clean, single-column design for better ATS (Applicant Tracking System) readability.</p>
              <div className="aspect-[3/4] bg-slate-100 rounded-2xl border-2 border-dashed flex items-center justify-center p-8">
                 <div className="w-full h-full bg-white shadow-xl rounded-lg p-4 flex flex-col gap-3">
                    <div className="h-4 w-1/2 bg-slate-200 rounded" />
                    <div className="h-2 w-full bg-slate-100 rounded" />
                    <div className="h-24 w-full bg-primary/5 rounded border border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">Contact & Links</div>
                    <div className="h-32 w-full bg-slate-50 rounded flex flex-col gap-2 p-2">
                       <div className="h-2 w-1/3 bg-slate-200 rounded" />
                       <div className="h-2 w-full bg-slate-100 rounded" />
                       <div className="h-2 w-full bg-slate-100 rounded" />
                       <div className="h-2 w-3/4 bg-slate-100 rounded" />
                    </div>
                    <div className="h-32 w-full bg-amber-50 rounded flex flex-col gap-2 p-2">
                       <div className="h-2 w-1/4 bg-amber-200 rounded" />
                       <div className="h-2 w-full bg-amber-100 rounded" />
                       <div className="h-2 w-full bg-amber-100 rounded" />
                    </div>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-3xl border-2">
           <CardHeader>
              <CardTitle className="flex items-center gap-2 uppercase tracking-tighter">
                 <Target className="h-6 w-6 text-primary" /> Key Sections
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              {[
                { title: 'Contact Info', desc: 'Email, Phone, Location, GitHub, LinkedIn.' },
                { title: 'Technical Skills', desc: 'Group by category (Frontend, Backend, Tools).' },
                { title: 'Experience', desc: 'Focus on achievements, not just responsibilities.' },
                { title: 'Projects', desc: 'Include tech stack used and a link to the code/demo.' },
                { title: 'Education', desc: 'Degree, University, and relevant certifications.' }
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                   <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-1">{i+1}</div>
                   <div>
                      <h4 className="font-bold text-lg">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                   </div>
                </div>
              ))}
           </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Pro Tips for Developers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-slate-900 text-white p-6 rounded-3xl">
              <ListChecks className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold mb-2">Quantify Results</h3>
              <p className="text-sm text-slate-400">"Improved page load speed by 40%" is better than "Optimized website performance".</p>
           </Card>
           <Card className="bg-slate-900 text-white p-6 rounded-3xl">
              <ImageIcon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold mb-2">Portfolio Links</h3>
              <p className="text-sm text-slate-400">Recruiters want to see your code. Make your GitHub links prominent and easy to click.</p>
           </Card>
           <Card className="bg-slate-900 text-white p-6 rounded-3xl">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold mb-2">Tailor to Job</h3>
              <p className="text-sm text-slate-400">Match the keywords in your CV to the job description to pass ATS filters.</p>
           </Card>
        </div>
      </section>

      <section className="p-12 bg-primary/5 border-2 border-primary/10 rounded-[3rem] text-center space-y-6">
         <h2 className="text-3xl font-black uppercase tracking-tighter">Ready to Build Yours?</h2>
         <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use our AI Resume Builder to generate a professional PDF based on your course progress and skills.
         </p>
         <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/career">
              <Button size="lg" className="rounded-2xl px-12 font-black uppercase tracking-widest h-14 shadow-xl shadow-primary/20">
                 Start Builder
              </Button>
            </Link>
         </div>
      </section>
    </div>
  );
}
