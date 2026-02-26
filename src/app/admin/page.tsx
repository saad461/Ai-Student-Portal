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
  Clock,
  Plus,
  Search,
  FileText,
  AlertTriangle,
  Database,
  BookOpen,
  Edit,
  Trash2,
  FilePlus
} from 'lucide-react';
import Link from 'next/link';
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
import { seedCurriculumAction, saveCurriculumItemAction, deleteCurriculumItemAction } from './actions';
import { CurriculumItem, QuizQuestion } from '@/lib/curriculum';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentProfile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  submissions: { curriculum_id: string; status: string; submitted_at: string }[];
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
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'curriculum' | 'attendance'>('students');

  const [extraTaskText, setExtraTaskText] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<CurriculumItem> | null>(null);

  const fetchAdminData = useCallback(async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`*, submissions (*)`);

    setStudents((profiles as unknown as StudentProfile[]) || []);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    setMessages((msgs as unknown as SorryMessage[]) || []);

    const { data: curriculumData } = await supabase
      .from('curriculum')
      .select('*')
      .order('week', { ascending: true });

    setCurriculum((curriculumData as unknown as CurriculumItem[]) || []);

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*, profiles(full_name)')
      .order('date', { ascending: false });

    setAttendance(attendanceData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') router.push('/admin/login');
    else fetchAdminData();
  }, [router, fetchAdminData]);

  const handleSaveCurriculum = async (item: Partial<CurriculumItem>) => {
    if (!item.id) return;
    const res = await saveCurriculumItemAction(item);
    if (res.success) {
      setEditingItem(null);
      fetchAdminData();
    } else {
      alert('Error saving curriculum: ' + JSON.stringify(res.error));
    }
  };

  const handleDeleteCurriculum = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const res = await deleteCurriculumItemAction(id);
    if (res.success) fetchAdminData();
  };

  const moveItem = async (item: CurriculumItem, direction: 'up' | 'down') => {
    const moduleItems = curriculum.filter(i => i.week === item.week).sort((a, b) => (a.lecture_index || 0) - (b.lecture_index || 0));
    const currentIndex = moduleItems.findIndex(i => i.id === item.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < moduleItems.length) {
      const targetItem = moduleItems[targetIndex];
      const currentOrder = item.lecture_index || 0;
      const targetOrder = targetItem.lecture_index || 0;

      // Swap orders
      await saveCurriculumItemAction({ ...item, lecture_index: targetOrder });
      await saveCurriculumItemAction({ ...targetItem, lecture_index: currentOrder });
      fetchAdminData();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Admin Controls...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-500">Manage students and curriculum progression.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
              const res = await seedCurriculumAction();
              if (res.success) alert('Curriculum seeded successfully!');
              else alert('Error: ' + JSON.stringify(res.error));
            }}>
              <Database className="h-4 w-4 mr-2" /> Seed Curriculum
            </Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem('admin_auth'); router.push('/admin/login'); }}>
              Logout Admin
            </Button>
          </div>
        </header>

        <div className="flex gap-4 border-b pb-4 overflow-x-auto">
          <Button variant={activeTab === 'students' ? 'default' : 'ghost'} onClick={() => setActiveTab('students')}><Users className="h-4 w-4 mr-2" /> Students</Button>
          <Button variant={activeTab === 'curriculum' ? 'default' : 'ghost'} onClick={() => setActiveTab('curriculum')}><BookOpen className="h-4 w-4 mr-2" /> Modules & Lectures</Button>
          <Button variant={activeTab === 'attendance' ? 'default' : 'ghost'} onClick={() => setActiveTab('attendance')}><Clock className="h-4 w-4 mr-2" /> Attendance</Button>
        </div>

        {activeTab === 'students' ? (
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Enrolled Students</h2>
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
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">{student.full_name[0]}</div>
                        <div><p className="font-bold">{student.full_name}</p><p className="text-xs text-slate-500">Joined {new Date(student.enrollment_date).toLocaleDateString()}</p></div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center"><p className="text-xs text-slate-500 uppercase tracking-wider">Submissions</p><p className="font-bold">{student.submissions?.length || 0}</p></div>
                        <Badge variant={student.is_pro ? "default" : "secondary"}>{student.is_pro ? 'PRO' : 'BASIC'}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => setViewingStudent(student)}><FileText className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'curriculum' ? (
          <div className="space-y-12">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-bold">Course Modules</h2><p className="text-sm text-muted-foreground">Manage modules and lectures.</p></div>
              <Button onClick={() => setEditingItem({ id: `new-${Date.now()}`, week: curriculum.length ? Math.max(...curriculum.map(i => i.week)) + 1 : 1, day: 'Lecture 1', type: 'lecture', title: '', description: '', lecture_index: 1, module_index: curriculum.length ? Math.max(...curriculum.map(i => i.module_index || 0)) + 1 : 1 })}>
                <Plus className="h-4 w-4 mr-2" /> Add New Module
              </Button>
            </div>
            {[...new Set(curriculum.map(i => i.week))].sort((a, b) => a - b).map(week => {
              const moduleItems = curriculum.filter(i => i.week === week).sort((a, b) => (a.lecture_index || 0) - (b.lecture_index || 0));
              const moduleName = moduleItems[0]?.module_name || `Module ${week}`;
              return (
                <div key={week} className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">M{week}</div>
                     <h3 className="text-xl font-bold">{moduleName}</h3>
                     <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
                     <Button variant="outline" size="sm" onClick={() => {
                        const lastLecture = moduleItems[moduleItems.length - 1];
                        setEditingItem({
                          id: `new-${Date.now()}`,
                          week: week,
                          module_name: moduleName,
                          module_index: moduleItems[0]?.module_index || week,
                          day: `Lecture ${moduleItems.length + 1}`,
                          type: 'lecture',
                          title: '',
                          description: '',
                          lecture_index: (lastLecture?.lecture_index || 0) + 1
                        });
                     }}><Plus className="h-4 w-4 mr-2" /> Add Lecture</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {moduleItems.map((item) => (
                      <Card key={item.id} className="group hover:shadow-md transition-shadow relative">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2"><Badge variant="outline">#{item.lecture_index} {item.day}</Badge><Badge variant="secondary">{item.type}</Badge></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveItem(item, 'up')}><Clock className="h-4 w-4 rotate-180" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveItem(item, 'down')}><Clock className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItem(item)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCurriculum(item.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <CardTitle className="text-lg leading-tight mt-2">{item.title}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5" /> Attendance Log</h2>
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}><TableCell>{record.profiles?.full_name}</TableCell><TableCell>{new Date(record.date).toLocaleDateString()}</TableCell><TableCell><Badge className="bg-green-600">PRESENT</Badge></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Student Details: {viewingStudent?.full_name}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <h3 className="font-bold text-lg border-b pb-2">Submission History</h3>
              <Table>
                <TableHeader><TableRow><TableHead>Lecture ID</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {viewingStudent?.submissions?.map((sub, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{sub.curriculum_id}</TableCell>
                      <TableCell><Badge variant={sub.status === 'skipped' ? 'outline' : 'default'} className={sub.status === 'skipped' ? 'text-orange-500 border-orange-500' : 'bg-green-600'}>{sub.status.toUpperCase()}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(sub.submitted_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingItem?.id?.startsWith('new-') ? 'Add' : 'Edit'} Curriculum Item</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Module Number (Week)</Label><Input type="number" value={editingItem?.week || 1} onChange={(e) => setEditingItem(prev => ({ ...prev!, week: parseInt(e.target.value) }))} /></div>
                  <div className="space-y-2"><Label>Lecture Index (Order)</Label><Input type="number" value={editingItem?.lecture_index || 1} onChange={(e) => setEditingItem(prev => ({ ...prev!, lecture_index: parseInt(e.target.value) }))} /></div>
                </div>
                <div className="space-y-2"><Label>Module Name</Label><Input placeholder="e.g. HTML Foundation" value={editingItem?.module_name || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, module_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Lecture Label (Day)</Label><Input placeholder="e.g. Lecture 1" value={editingItem?.day || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, day: e.target.value }))} /></div>

                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <select className="w-full p-2 rounded border bg-background" value={editingItem?.type || 'lecture'} onChange={(e) => setEditingItem(prev => ({ ...prev!, type: e.target.value as any }))}>
                    <option value="lecture">Lecture</option>
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="task">Task</option>
                  </select>
                </div>

                <div className="space-y-2"><Label>Title</Label><Input value={editingItem?.title || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={editingItem?.description || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, description: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Required Focus Hours</Label><Input type="number" step="0.5" value={editingItem?.required_focus_hours || 0} onChange={(e) => setEditingItem(prev => ({ ...prev!, required_focus_hours: parseFloat(e.target.value) }))} /></div>
              </div>

              <div className="space-y-4 border-l pl-8 overflow-y-auto">
                {editingItem?.type === 'lecture' && (
                  <div className="space-y-2">
                    <Label>Theory Content (Markdown supported)</Label>
                    <Textarea className="min-h-[300px] font-mono text-sm" value={editingItem.theory_content || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, theory_content: e.target.value }))} />
                  </div>
                )}

                {(editingItem?.type === 'assignment' || editingItem?.type === 'lecture') && (
                   <div className="space-y-4 border-t pt-4">
                      <h4 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Attached Assignment</h4>
                      <div className="space-y-2">
                         <Label>Assignment Title</Label>
                         <Input value={editingItem.attached_assignment?.title || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, attached_assignment: { ...prev!.attached_assignment!, title: e.target.value, description: prev!.attached_assignment?.description || '', requirements: prev!.attached_assignment?.requirements || [] } }))} />
                      </div>
                      <div className="space-y-2">
                         <Label>Description</Label>
                         <Textarea value={editingItem.attached_assignment?.description || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, attached_assignment: { ...prev!.attached_assignment!, description: e.target.value, title: prev!.attached_assignment?.title || '', requirements: prev!.attached_assignment?.requirements || [] } }))} />
                      </div>
                      <div className="space-y-2">
                         <Label>Requirements (One per line)</Label>
                         <Textarea
                            value={editingItem.attached_assignment?.requirements?.join('\n') || ''}
                            onChange={(e) => setEditingItem(prev => ({ ...prev!, attached_assignment: { ...prev!.attached_assignment!, requirements: e.target.value.split('\n').filter(r => r.trim()), title: prev!.attached_assignment?.title || '', description: prev!.attached_assignment?.description || '' } }))}
                         />
                      </div>
                   </div>
                )}

                {(editingItem?.type === 'quiz' || editingItem?.type === 'lecture') && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Attached Quiz</h4>
                    <p className="text-xs text-muted-foreground">Add JSON array of QuizQuestion objects here or use a better builder if needed.</p>
                    <Textarea
                      className="font-mono text-xs"
                      placeholder='[{"question": "What is HTML?", "options": ["A", "B"], "correctAnswer": 0}]'
                      value={JSON.stringify(editingItem.attached_quiz || [], null, 2)}
                      onChange={(e) => {
                        try {
                          const quiz = JSON.parse(e.target.value);
                          setEditingItem(prev => ({ ...prev!, attached_quiz: quiz }));
                        } catch (err) {}
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveCurriculum(editingItem!)}>Save Curriculum Item</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
