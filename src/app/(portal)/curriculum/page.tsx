'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { CurriculumItem, isItemUnlocked } from '@/lib/curriculum';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Lock, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TermsModal } from '@/components/terms-modal';

interface Submission {
  id: string;
  curriculum_id: string;
  status: string;
}

export default function CurriculumPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreedTC, setAgreedTC] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [skipPin, setSkipPin] = useState('');

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setAgreedTC(profile.agreed_tc);
    }

    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', user.id);

    setSubmissions((subs as unknown as Submission[]) || []);

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*')
      .order('week', { ascending: true });

    setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);

    const { data: focusData } = await supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('student_id', user.id);

    if (focusData) {
      const totalSeconds = focusData.reduce((acc, curr) => acc + curr.duration_seconds, 0);
      setTotalFocusMinutes(Math.round(totalSeconds / 60));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAgreeTC = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ agreed_tc: true }).eq('id', user.id);
      setAgreedTC(true);
      setShowTerms(false);
      fetchData();
    }
  };

  const handleSkip = async (itemId: string) => {
    if (skipPin !== '7323') {
      alert('Invalid PIN');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('submissions').upsert({
        student_id: user.id,
        curriculum_id: itemId,
        status: 'skipped',
        feedback: 'Skipped by student using PIN'
      });
      setSkippingId(null);
      setSkipPin('');
      fetchData();
    }
  };

  const modules = Array.from({ length: 24 }, (_, i) => i + 1);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Course Curriculum</h1>
            <p className="text-muted-foreground mt-2">Your sequential path to mastery.</p>
          </header>

          <Tabs defaultValue="1" className="w-full">
            <div className="overflow-x-auto pb-4">
              <TabsList className="inline-flex w-max">
                {modules.map((m) => (
                  <TabsTrigger
                    key={m}
                    value={m.toString()}
                  >
                    Module {m}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {modules.map((m) => (
              <TabsContent key={m} value={m.toString()} className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Module {m}: {m <= 4 ? 'Foundations' : m <= 8 ? 'Advanced JS' : m <= 12 ? 'React Mastery' : 'Fullstack Dev'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {curriculum.filter(item => item.week === m).map((item) => {
                    const submission = submissions.find(s => s.curriculum_id === item.id);
                    const isSubmitted = submission && submission.status !== 'skipped';
                    const isSkipped = submission && submission.status === 'skipped';

                    const isUnlocked = isItemUnlocked(item, curriculum, submissions, agreedTC);
                    const isFocusUnlocked = (totalFocusMinutes / 60) >= (item.required_focus_hours || 0);

                    return (
                      <Card key={item.id} className={cn(
                        "flex flex-col transition-all",
                        (!isUnlocked || !isFocusUnlocked) && "opacity-50 grayscale"
                      )}>
                        <CardHeader className="flex-none">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="mb-2">{item.day}</Badge>
                                <Badge variant="outline" className="mb-2 uppercase text-[10px] flex items-center gap-1">
                                  {item.type === 'lecture' && <Video className="h-2 w-2" />}
                                  {item.type}
                                </Badge>
                                {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground mb-2" />}
                            </div>
                            {isSubmitted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {isSkipped && <Badge variant="outline" className="text-orange-500 border-orange-500">Skipped</Badge>}
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                          <p className="text-sm text-muted-foreground">{item.description}</p>

                          {item.requirements && item.requirements.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Requirements:</p>
                              <ul className="text-xs space-y-1">
                                {item.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <div className="h-1 w-1 rounded-full bg-primary mt-1.5" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>

                        {!isSubmitted && !isSkipped && isUnlocked && isFocusUnlocked && item.type === 'lecture' && (
                           <CardFooter className="pt-0 pb-6 px-6">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                              >
                                <Link href={`/lecture/${item.id}`}>
                                  Open Lecture Room
                                </Link>
                              </Button>
                           </CardFooter>
                        )}

                        {!isSubmitted && !isSkipped && !isUnlocked && !agreedTC && item.week === 1 && curriculum.sort((a,b) => a.week-b.week)[0]?.id === item.id && (
                           <CardFooter className="pt-0 pb-6 px-6">
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => setShowTerms(true)}
                              >
                                View Terms to Unlock
                              </Button>
                           </CardFooter>
                        )}

                        {!isSubmitted && !isSkipped && (
                          <CardFooter className="pt-0 pb-6 px-6">
                            <Dialog open={skippingId === item.id} onOpenChange={(open) => !open && setSkippingId(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setSkippingId(item.id)}>
                                  Skip this Lecture
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Skip Lecture</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="skip-pin">Enter Skip PIN</Label>
                                  <Input
                                    id="skip-pin"
                                    type="password"
                                    placeholder="Enter PIN to skip"
                                    value={skipPin}
                                    onChange={(e) => setSkipPin(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => handleSkip(item.id)} disabled={!skipPin}>
                                    Confirm Skip
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <TermsModal isOpen={showTerms} onAgree={handleAgreeTC} />
    </div>
  );
}
