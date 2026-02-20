'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { CurriculumItem } from '@/lib/curriculum';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
import { Textarea } from '@/components/ui/textarea';

interface Submission {
  id: string;
  curriculum_id: string;
}

export default function CurriculumPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  const [sorryMessage, setSorryMessage] = useState('');
  const [sendingSorry, setSendingSorry] = useState<string | null>(null);

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
      const start = new Date(profile.enrollment_date);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      setCurrentWeek(Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1);
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

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendSorry = async (curriculumId: string) => {
    setSendingSorry(curriculumId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('messages').insert({
        student_id: user.id,
        curriculum_id: curriculumId,
        body: sorryMessage,
        status: 'pending'
      });
      setSorryMessage('');
      setSendingSorry(null);
      fetchData();
    }
  };

  const isDayPassed = (week: number, day: string) => {
    const today = new Date();
    const dayMap: Record<string, number> = { 'Monday': 1, 'Wednesday': 3, 'Friday': 5, 'Monthly': 5, 'Final': 5 };

    if (week < currentWeek) return true;
    if (week > currentWeek) return false;

    const targetDay = dayMap[day] || 0;
    return today.getDay() > targetDay;
  };

  const weeks = Array.from({ length: 24 }, (_, i) => i + 1);

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
            <p className="text-muted-foreground mt-2">Your 24-week path to mastery.</p>
          </header>

          <Tabs defaultValue={currentWeek.toString()} className="w-full">
            <div className="overflow-x-auto pb-4">
              <TabsList className="inline-flex w-max">
                {weeks.map((w) => (
                  <TabsTrigger
                    key={w}
                    value={w.toString()}
                  >
                    Week {w}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {weeks.map((w) => (
              <TabsContent key={w} value={w.toString()} className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Week {w}: {w <= 4 ? 'Foundations' : w <= 8 ? 'Advanced JS' : w <= 12 ? 'React Mastery' : 'Fullstack Dev'}</h2>
                  {w > currentWeek && (
                    <Badge variant="outline" className="flex items-center gap-2 border-blue-500 text-blue-500">
                      <BookOpen className="h-3 w-3" /> Preview: Week {w}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {curriculum.filter(item => item.week === w).map((item) => {
                    const isSubmitted = submissions.find(s => s.curriculum_id === item.id);
                    const isMissed = !isSubmitted && isDayPassed(w, item.day);

                    return (
                      <Card key={item.id} className="flex flex-col">
                        <CardHeader className="flex-none">
                          <div className="flex justify-between items-start">
                            <Badge variant="secondary" className="mb-2">{item.day}</Badge>
                            {isSubmitted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {isMissed && <AlertCircle className="h-5 w-5 text-destructive" />}
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                        {isMissed && (
                          <CardFooter className="pt-0 pb-6 px-6">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="w-full">Missed - Appeal</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Appeal Missed Assignment</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="sorry-cur">Your Explanation</Label>
                                  <Textarea
                                    id="sorry-cur"
                                    placeholder="I'm sorry, I missed this because..."
                                    value={sorryMessage}
                                    onChange={(e) => setSorryMessage(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => handleSendSorry(item.id)} disabled={!sorryMessage || sendingSorry === item.id}>
                                    {sendingSorry === item.id ? 'Sending...' : 'Send Appeal'}
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
    </div>
  );
}
