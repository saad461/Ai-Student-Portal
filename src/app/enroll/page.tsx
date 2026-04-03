'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Captcha } from '@/components/captcha';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EnrollPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    cnic: '',
    email: '',
    age: '',
    phone: '',
    skillsLevel: '',
    objective: '',
    education: '',
    city: '',
    github: '',
    passport: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, passport: e.target.files[0] });
    }
  };

  const generateCoursePin = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const downloadPDF = (data: typeof formData, pin: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text('PRO DEV TRAINING PORTAL', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Enrollment Application Details', 105, 30, { align: 'center' });

    doc.setDrawColor(0, 102, 204);
    doc.line(20, 35, 190, 35);

    // Form Data Table
    const tableData = [
      ['First Name', data.firstName],
      ['Last Name', data.lastName],
      ['Gender', data.gender],
      ['CNIC Number', data.cnic],
      ['Email Address', data.email],
      ['Age', data.age],
      ['Phone Number', data.phone],
      ['City', data.city],
      ['Education', data.education],
      ['Skill Level', data.skillsLevel],
      ['GitHub Profile', data.github || 'N/A'],
      ['Objective', data.objective],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Information']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
    });

    // Secret Pin Section
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFillColor(240, 240, 240);
    doc.rect(20, finalY, 170, 40, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SECRET COURSE PIN', 105, finalY + 15, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(255, 0, 0);
    doc.text(pin, 105, finalY + 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Keep this PIN safe. It will be required for your final certification.', 105, finalY + 50, { align: 'center' });

    doc.save(`Enrollment_${data.firstName}_${data.lastName}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pin = generateCoursePin();
      setGeneratedPin(pin);

      // 1. Upload Passport Picture
      let passportUrl = '';
      if (formData.passport) {
        const fileExt = formData.passport.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('passports')
          .upload(fileName, formData.passport);

        if (uploadError) throw uploadError;
        passportUrl = fileName;
      }

      // 2. Create Application Entry
      const { error: appError } = await supabase.from('applications').insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        cnic: formData.cnic,
        email: formData.email,
        age: parseInt(formData.age),
        phone_number: formData.phone,
        passport_url: passportUrl,
        skills_level: formData.skillsLevel,
        objective: formData.objective,
        education: formData.education,
        city: formData.city,
        github_link: formData.github,
        course_pin: pin,
        status: 'pending'
      });

      if (appError) throw appError;

      setSubmitted(true);
      downloadPDF(formData, pin);

    } catch (error) {
      console.error('Enrollment error:', error);
      const err = error as { message?: string };
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans selection:bg-blue-500/30">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 animate-pulse delay-700" />
        </div>

        <Card className="w-full max-w-md text-center bg-slate-900/80 backdrop-blur-3xl border-white/10 rounded-3xl relative z-10 shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter text-white">Application Received</CardTitle>
            <CardDescription className="text-slate-400 font-medium pt-2">
              The system has processed your request. Our instructors will evaluate your profile and contact you via email with deployment instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 py-6 space-y-6">
            <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Security Access Pin</p>
              <p className="text-4xl font-mono font-black text-blue-500 tracking-[0.2em]">{generatedPin}</p>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              An encryption key (PDF) has been generated and downloaded. Store it in a secure location.
            </p>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex flex-col gap-3">
            <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 text-white font-black uppercase tracking-widest text-[10px]" onClick={() => downloadPDF(formData, generatedPin)}>
              <Download className="mr-2 h-4 w-4" /> Redownload Credentials
            </Button>
              <Button className="w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-black uppercase tracking-widest text-[10px] border-none" onClick={() => router.push('/')}>
              Back to Command Center
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const validateStep = (s: number) => {
    if (s === 1) {
      return formData.firstName && formData.lastName && formData.gender && formData.age && formData.cnic && formData.passport;
    }
    if (s === 2) {
      return formData.email && formData.phone && formData.city;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <Card className="max-w-3xl mx-auto shadow-2xl overflow-hidden border-white/10 bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] relative z-10">
        <CardHeader className="bg-slate-900/80 text-white p-10 md:p-12 border-b border-white/5 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 p-10 hidden md:block">
             <div className="text-6xl font-black text-white/5 uppercase tracking-tighter leading-none">{step}/3</div>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
               <Loader2 className="h-6 w-6 text-white animate-spin-slow" />
            </div>
            <div>
              <CardTitle className="text-4xl font-black uppercase tracking-tighter leading-none">Initialize Training</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Phase 01: Cadet Enrollment Protocol</CardDescription>
            </div>
          </div>

          <div className="mt-10 flex gap-3">
             {[1, 2, 3].map((i) => (
               <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", i <= step ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-white/10")} />
             ))}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-10 md:p-12 space-y-10 min-h-[500px]">
            {error && <div className="p-4 text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 animate-in fade-in">{error}</div>}

            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                    <span className="text-blue-500 font-mono">01.</span> Personal Core
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Provide your primary identification metrics.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Given Name</Label>
                    <Input id="firstName" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Family Name</Label>
                    <Input id="lastName" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Gender Bias</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, gender: val })} value={formData.gender}>
                      <SelectTrigger className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:ring-blue-500/50"><SelectValue placeholder="Identify..." /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="Male" className="focus:bg-blue-600 focus:text-white cursor-pointer">Male</SelectItem>
                        <SelectItem value="Female" className="focus:bg-blue-600 focus:text-white cursor-pointer">Female</SelectItem>
                        <SelectItem value="Other" className="focus:bg-blue-600 focus:text-white cursor-pointer">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Solar Cycles (Age)</Label>
                    <Input id="age" type="number" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Civilian ID (CNIC)</Label>
                    <Input id="cnic" placeholder="00000-0000000-0" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50 font-mono tracking-widest" value={formData.cnic} onChange={(e) => setFormData({ ...formData, cnic: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Visual ID (Passport Photo)</Label>
                    <div className="relative group border-2 border-dashed border-white/5 bg-slate-950/30 rounded-2xl p-4 hover:border-blue-500/50 hover:bg-slate-950/50 transition-all cursor-pointer h-12 flex items-center justify-center">
                      <Input id="passport" type="file" accept="image/*" required onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {formData.passport ? formData.passport.name : 'Upload Frame...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                    <span className="text-blue-500 font-mono">02.</span> Comm Channels
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">How the system reaches you.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Digital Signal (Email)</Label>
                    <Input id="email" type="email" placeholder="identity@domain.com" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Voice Frequency (Phone)</Label>
                    <Input id="phone" placeholder="+92 000 0000000" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50 font-mono" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Geo Location (City)</Label>
                    <Input id="city" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Archive Repository (GitHub)</Label>
                    <Input id="github" placeholder="github.com/identity" className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.github} onChange={(e) => setFormData({ ...formData, github: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                    <span className="text-blue-500 font-mono">03.</span> Cognitive Load
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Define your technical trajectory.</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Academic Status</Label>
                    <Input id="education" placeholder="Last Degree / Institution" required className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:border-blue-500/50" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Operational Level</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, skillsLevel: val })} value={formData.skillsLevel}>
                      <SelectTrigger className="bg-slate-950/50 border-white/5 h-12 rounded-xl text-white focus:ring-blue-500/50"><SelectValue placeholder="Quantify your skill level..." /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="Beginner" className="focus:bg-blue-600 focus:text-white cursor-pointer">Cadet (Initial State)</SelectItem>
                        <SelectItem value="Intermediate" className="focus:bg-blue-600 focus:text-white cursor-pointer">Operator (Basic JS/HTML)</SelectItem>
                        <SelectItem value="Advanced" className="focus:bg-blue-600 focus:text-white cursor-pointer">Architect (Building Apps)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Primary Directive (Objective)</Label>
                    <Textarea id="objective" placeholder="What is your ultimate goal?" className="bg-slate-950/50 border-white/5 rounded-2xl text-white focus:border-blue-500/50 min-h-[140px] p-4" required value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })} />
                  </div>

                  <div className="pt-10 border-t border-white/5 space-y-4">
                    <Label className="text-center block text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Bot Mitigation Protocol</Label>
                    <div className="flex justify-center bg-slate-950/30 p-8 rounded-3xl border border-white/5">
                      <Captcha onVerify={setIsCaptchaVerified} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-10 md:p-12 bg-slate-900/50 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4">
            {step > 1 && (
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(step - 1)} className="w-full sm:w-auto px-10 h-14 rounded-2xl border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs transition-all">
                Previous Phase
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" size="lg" onClick={() => setStep(step + 1)} disabled={!validateStep(step)} className="w-full sm:w-auto ml-auto px-12 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale border-none">
                Continue Analysis
              </Button>
            ) : (
              <Button type="submit" size="lg" className="w-full sm:w-auto ml-auto px-16 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale border-none" disabled={loading || !isCaptchaVerified}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : 'Execute Enrollment'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
