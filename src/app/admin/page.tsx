'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageCircle,
  Check,
  Plus,
  Search,
  FileText,
  AlertTriangle,
  Database,
  BookOpen,
  Edit,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { seedCurriculumAction } from './actions';
import { CurriculumItem } from '@/lib/curriculum';

interface StudentProfile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  submissions: { count: number }[];
}

interface SorryMessage {
  id: string;
  student_id: string;
  body: string;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [messages, setMessages] = useState<SorryMessage[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'curriculum'>('students');

  const [extraTaskText, setExtraTaskText] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchAdminData = useCallback(async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        *,
        submissions (count)
      `);

    setStudents((profiles as unknown as StudentProfile[]) || []);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    setMessages((msgs as unknown as SorryMessage[]) || []);

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*')
      .order('week', { ascending: true })
      .order('day', { ascending: true });

    setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {

      fetchAdminData();
    }
  }, [router, fetchAdminData]);

  const handleForgive = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ status: 'resolved', admin_reply: 'Forgiven. Don\'t miss the next one!' })
      .eq('id', messageId);

    fetchAdminData();
  };

  const handleAssignExtraTask = async (messageId: string, studentId: string) => {
    setIsAssigning(true);

    await supabase.from('extra_tasks').insert({
      student_id: studentId,
      message_id: messageId,
      description: extraTaskText
    });

    await supabase
      .from('messages')
      .update({
        status: 'extra_task_assigned',
        admin_reply: `Extra task assigned: ${extraTaskText}`
      })
      .eq('id', messageId);

    setExtraTaskText('');
    setIsAssigning(false);
    fetchAdminData();
  };

  const [editingItem, setEditingItem] = useState<Partial<CurriculumItem> | null>(null);

  const handleSaveCurriculum = async (item: Partial<CurriculumItem>) => {
    if (!item.id) return;

    const { error } = await supabase
      .from('curriculum')
      .upsert(item);

    if (!error) {
      setEditingItem(null);
      fetchAdminData();
    }
  };

  const handleDeleteCurriculum = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const { error } = await supabase
      .from('curriculum')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchAdminData();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Admin Controls...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500">Manage students and curriculum progression.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
              if(!confirm('This will update/overwrite the current curriculum. Continue?')) return;
              const res = await seedCurriculumAction();
              if (res.success) alert('Curriculum seeded successfully!');
              else alert('Error seeding curriculum: ' + (res.error as any)?.message || JSON.stringify(res.error));
            }}>
              <Database className="h-4 w-4 mr-2" /> Seed Curriculum
            </Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem('admin_auth'); router.push('/admin/login'); }}>
              Logout Admin
            </Button>
          </div>
        </header>

        <div className="flex gap-4 border-b pb-4">
          <Button
            variant={activeTab === 'students' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('students')}
          >
            <Users className="h-4 w-4 mr-2" /> Students
          </Button>
          <Button
            variant={activeTab === 'curriculum' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('curriculum')}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Curriculum
          </Button>
        </div>

        {activeTab === 'students' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Students List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
               <h2 className="text-xl font-semibold flex items-center gap-2">
                 <Users className="h-5 w-5" />
                 Enrolled Students
               </h2>
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <Input placeholder="Search students..." className="pl-9" />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                        {student.full_name[0]}
                      </div>
                      <div>
                        <p className="font-bold">{student.full_name}</p>
                        <p className="text-xs text-slate-500">Joined {new Date(student.enrollment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Submissions</p>
                        <p className="font-bold">{student.submissions?.[0]?.count || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Level</p>
                        <Badge variant={student.is_pro ? "default" : "secondary"} className={student.is_pro ? "bg-purple-600" : ""}>
                          {student.is_pro ? 'PRO' : 'BASIC'}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pending Requests / Messages */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Sorry Messages
            </h2>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No pending messages.</p>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.id} className={msg.status === 'pending' ? "border-orange-200" : "opacity-60"}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-bold text-slate-400">{new Date(msg.created_at).toLocaleTimeString()}</p>
                         <Badge variant={msg.status === 'pending' ? "outline" : "secondary"}>
                           {msg.status}
                         </Badge>
                      </div>
                      <CardTitle className="text-sm mt-1">{msg.profiles?.full_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 p-2 rounded italic">
                        &quot;{msg.body}&quot;
                      </p>

                      {msg.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleForgive(msg.id)}>
                            <Check className="h-4 w-4 mr-1" /> Forgive
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="flex-1">
                                <Plus className="h-4 w-4 mr-1" /> Penalty
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Extra Task</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Task Description</Label>
                                  <Textarea
                                    placeholder="Complete a 500-word essay on Git branching..."
                                    value={extraTaskText}
                                    onChange={(e) => setExtraTaskText(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handleAssignExtraTask(msg.id, msg.student_id)}
                                  disabled={!extraTaskText || isAssigning}
                                >
                                  Assign & Send
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="bg-blue-600 text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Weekly Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>New Enrollments</span>
                  <span className="font-bold">{students.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Assignment Completion</span>
                  <span className="font-bold">85%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Course Modules</h2>
              <Button onClick={() => setEditingItem({
                id: `new-${Date.now()}`,
                week: 1,
                day: 'Monday',
                type: 'assignment',
                title: '',
                description: ''
              })}>
                <Plus className="h-4 w-4 mr-2" /> Add Module
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {curriculum.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{item.day}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCurriculum(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">W{item.week}: {item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <Badge variant="secondary" className="mt-2">{item.type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Edit Module Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingItem?.id?.startsWith('new-') ? 'Add' : 'Edit'} Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Week</Label>
                  <Input
                    type="number"
                    value={editingItem?.week || 1}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, week: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={editingItem?.day || 'Monday'}
                    onChange={(e) => setEditingItem(prev => ({ ...prev!, day: e.target.value as CurriculumItem['day'] }))}
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Monthly</option>
                    <option>Final</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={editingItem?.type || 'assignment'}
                  onChange={(e) => setEditingItem(prev => ({ ...prev!, type: e.target.value as CurriculumItem['type'] }))}
                >
                  <option value="assignment">Assignment</option>
                  <option value="task">Task</option>
                  <option value="quiz">Quiz</option>
                  <option value="grand_test">Grand Test</option>
                  <option value="final_project">Final Project</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingItem?.title || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev!, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev!, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="flex justify-between items-center">
                  Requirements
                  <Button size="sm" variant="outline" onClick={() => {
                    const reqs = editingItem?.requirements || [];
                    setEditingItem(prev => ({ ...prev!, requirements: [...reqs, ''] }));
                  }}>
                    <Plus className="h-3 w-3 mr-1" /> Add Requirement
                  </Button>
                </Label>
                <div className="space-y-2">
                  {(editingItem?.requirements || []).map((req, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={req}
                        onChange={(e) => {
                          const newReqs = [...(editingItem?.requirements || [])];
                          newReqs[idx] = e.target.value;
                          setEditingItem(prev => ({ ...prev!, requirements: newReqs }));
                        }}
                        placeholder={`Requirement ${idx + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const newReqs = (editingItem?.requirements || []).filter((_, i) => i !== idx);
                        setEditingItem(prev => ({ ...prev!, requirements: newReqs }));
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(editingItem?.requirements || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No requirements added.</p>
                  )}
                </div>
              </div>

              {(editingItem?.type === 'quiz' || editingItem?.type === 'grand_test') && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Quiz Content (JSON format)</Label>
                  <Textarea
                    className="font-mono text-xs h-40"
                    placeholder='[{"question": "...", "options": ["...", "..."], "correctAnswer": 0}]'
                    value={JSON.stringify(editingItem?.content, null, 2)}
                    onChange={(e) => {
                      try {
                        const content = JSON.parse(e.target.value);
                        setEditingItem(prev => ({ ...prev!, content }));
                      } catch {
                        // Keep typing...
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">Ensure the JSON is valid to save quiz questions.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => handleSaveCurriculum(editingItem!)}>Save Module</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
