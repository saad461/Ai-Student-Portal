'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  FilePlus,
  Layers,
  ChevronRight,
  ChevronDown,
  Layout,
  Video as VideoIcon
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
import {
  seedCurriculumAction,
  saveCurriculumItemAction,
  deleteCurriculumItemAction,
  saveModuleAction,
  deleteModuleAction,
  saveSubModuleAction,
  deleteSubModuleAction,
  uploadVideoAction
} from './actions';
import { CurriculumItem, QuizQuestion, Module, SubModule, extractHeadings } from '@/lib/curriculum';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RichTextEditor } from '@/components/rich-text-editor';
import { cn } from '@/lib/utils';

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
  const [modules, setModules] = useState<Module[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'curriculum' | 'attendance' | 'structure'>('students');

  const [extraTaskText, setExtraTaskText] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<CurriculumItem> | null>(null);
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  const [editingSubModule, setEditingSubModule] = useState<Partial<SubModule> | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
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

    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .order('index', { ascending: true });
    setModules((modulesData as Module[]) || []);

    const { data: subModulesData } = await supabase
      .from('sub_modules')
      .select('*')
      .order('index', { ascending: true });
    setSubModules((subModulesData as SubModule[]) || []);

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

  const handleSaveModule = async (mod: Partial<Module>) => {
    const res = await saveModuleAction(mod);
    if (res.success) {
      setEditingModule(null);
      fetchAdminData();
    } else {
      alert('Error saving module: ' + JSON.stringify(res.error));
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Are you sure? This will delete all sub-modules and lectures in this module.')) return;
    const res = await deleteModuleAction(id);
    if (res.success) fetchAdminData();
  };

  const handleSaveSubModule = async (sub: Partial<SubModule>) => {
    const res = await saveSubModuleAction(sub);
    if (res.success) {
      setEditingSubModule(null);
      fetchAdminData();
    } else {
      alert('Error saving sub-module: ' + JSON.stringify(res.error));
    }
  };

  const handleDeleteSubModule = async (id: string) => {
    if (!confirm('Are you sure? This will affect all lectures in this sub-module.')) return;
    const res = await deleteSubModuleAction(id);
    if (res.success) fetchAdminData();
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
          <Button variant={activeTab === 'structure' ? 'default' : 'ghost'} onClick={() => setActiveTab('structure')}><Layout className="h-4 w-4 mr-2" /> Course Structure</Button>
          <Button variant={activeTab === 'curriculum' ? 'default' : 'ghost'} onClick={() => setActiveTab('curriculum')}><BookOpen className="h-4 w-4 mr-2" /> Lectures & Content</Button>
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
        ) : activeTab === 'structure' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Course Modules & Sub-Modules</h2>
                <p className="text-sm text-muted-foreground">Define the high-level hierarchy of your course.</p>
              </div>
              <Button onClick={() => setEditingModule({ index: modules.length + 1, name: '' })}>
                <Plus className="h-4 w-4 mr-2" /> Add Module
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {modules.map(mod => (
                <Card key={mod.id} className="overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 flex justify-between items-center border-b">
                    <div className="flex items-center gap-3">
                      <Badge className="h-8 w-8 rounded-full flex items-center justify-center p-0 text-lg">M{mod.index}</Badge>
                      <h3 className="font-bold text-lg">{mod.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingSubModule({ module_id: mod.id, index: subModules.filter(s => s.module_id === mod.id).length + 1, name: '' })}>
                        <Plus className="h-4 w-4 mr-2" /> Add Sub-Module
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingModule(mod)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteModule(mod.id!)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {subModules.filter(s => s.module_id === mod.id).map(sub => (
                        <div key={sub.id} className="p-4 pl-12 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{sub.name}</span>
                            <Badge variant="outline" className="text-[10px]">Index {sub.index}</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingSubModule(sub)}><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSubModule(sub.id!)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                      {subModules.filter(s => s.module_id === mod.id).length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-400 italic">No sub-modules yet. Add one to group your lectures.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {modules.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed rounded-xl">
                  <Layout className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No modules created yet. Start by adding your first module.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setEditingModule({ index: 1, name: '' })}>Add First Module</Button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'curriculum' ? (
          <div className="space-y-12">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-bold">Course Content</h2><p className="text-sm text-muted-foreground">Manage lectures, assignments, and quizzes.</p></div>
              <Button onClick={() => {
                const lastMod = modules[modules.length - 1];
                const lastSub = subModules.filter(s => s.module_id === lastMod?.id).pop();
                setEditingItem({
                  id: `new-${Date.now()}`,
                  week: lastMod?.index || 1,
                  module_name: lastMod?.name || '',
                  day: 'Lecture 1',
                  type: 'lecture',
                  title: '',
                  description: '',
                  lecture_index: 1,
                  sub_module_id: lastSub?.id,
                  sub_module_name: lastSub?.name
                });
              }}>
                <Plus className="h-4 w-4 mr-2" /> Add New Lecture
              </Button>
            </div>
            {modules.length > 0 ? modules.map(mod => {
              const moduleSubModules = subModules.filter(s => s.module_id === mod.id);
              const moduleLectures = curriculum.filter(i => i.week === mod.index);

              return (
                <div key={mod.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">M{mod.index}</div>
                     <h3 className="text-xl font-bold">{mod.name}</h3>
                     <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
                  </div>

                  <div className="space-y-8 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-5">
                    {moduleSubModules.map(sub => {
                      const subLectures = moduleLectures.filter(l => l.sub_module_id === sub.id).sort((a, b) => (a.lecture_index || 0) - (b.lecture_index || 0));
                      return (
                        <div key={sub.id} className="space-y-4">
                          <h4 className="font-bold text-slate-500 flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" /> {sub.name}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subLectures.map((item) => (
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
                            <Button
                              variant="ghost"
                              className="h-full min-h-[100px] border-2 border-dashed hover:border-primary hover:bg-primary/5 group"
                              onClick={() => setEditingItem({
                                id: `new-${Date.now()}`,
                                week: mod.index,
                                module_name: mod.name,
                                sub_module_id: sub.id,
                                sub_module_name: sub.name,
                                day: `Lecture ${subLectures.length + 1}`,
                                type: 'lecture',
                                title: '',
                                description: '',
                                lecture_index: (subLectures[subLectures.length - 1]?.lecture_index || 0) + 1
                              })}
                            >
                              <Plus className="h-6 w-6 text-slate-300 group-hover:text-primary mb-2" />
                              <span className="text-slate-400 group-hover:text-primary font-medium">Add to {sub.name}</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Lectures with no sub-module */}
                    {moduleLectures.filter(l => !l.sub_module_id).length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-400 italic flex items-center gap-2">
                          <ChevronRight className="h-4 w-4" /> Uncategorized Lectures
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {moduleLectures.filter(l => !l.sub_module_id).map((item) => (
                              <Card key={item.id} className="group hover:shadow-md transition-shadow relative">
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex gap-2"><Badge variant="outline">#{item.lecture_index} {item.day}</Badge><Badge variant="secondary">{item.type}</Badge></div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="p-12 text-center border-2 border-dashed rounded-xl">
                 <Layout className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                 <p className="text-slate-500">Create some Modules first in the "Course Structure" tab.</p>
                 <Button variant="outline" className="mt-4" onClick={() => setActiveTab('structure')}>Go to Course Structure</Button>
              </div>
            )}
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
            <div className="flex flex-col gap-8 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Module</Label>
                    <select
                      className="w-full p-2 rounded border bg-background"
                      value={editingItem?.week || ''}
                      onChange={(e) => {
                        const mod = modules.find(m => m.index === parseInt(e.target.value));
                        setEditingItem(prev => ({ ...prev!, week: parseInt(e.target.value), module_name: mod?.name || '' }))
                      }}
                    >
                      <option value="">Select Module</option>
                      {modules.map(m => <option key={m.id} value={m.index}>M{m.index}: {m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sub-Module</Label>
                    <select
                      className="w-full p-2 rounded border bg-background"
                      value={editingItem?.sub_module_id || ''}
                      onChange={(e) => {
                        const sub = subModules.find(s => s.id === e.target.value);
                        setEditingItem(prev => ({ ...prev!, sub_module_id: e.target.value, sub_module_name: sub?.name || '' }))
                      }}
                    >
                      <option value="">No Sub-Module</option>
                      {subModules.filter(s => s.module_id === modules.find(m => m.index === editingItem?.week)?.id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Lecture Label (e.g. Lecture 1)</Label><Input placeholder="e.g. Lecture 1" value={editingItem?.day || ''} onChange={(e) => setEditingItem(prev => ({ ...prev!, day: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Lecture Index (Order)</Label><Input type="number" value={editingItem?.lecture_index || 1} onChange={(e) => setEditingItem(prev => ({ ...prev!, lecture_index: parseInt(e.target.value) }))} /></div>
                </div>

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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Required Focus Hours</Label>
                    <Input type="number" step="0.5" value={editingItem?.required_focus_hours || 0} onChange={(e) => setEditingItem(prev => ({ ...prev!, required_focus_hours: parseFloat(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Read Time Override (mins)</Label>
                    <Input type="number" placeholder="Leave 0 for auto" value={editingItem?.required_read_minutes || 0} onChange={(e) => setEditingItem(prev => ({ ...prev!, required_read_minutes: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Video URL or Upload</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      className="flex-1"
                      value={editingItem?.video_url || ''}
                      onChange={(e) => setEditingItem(prev => ({ ...prev!, video_url: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isVideoUploading}
                      onClick={() => videoInputRef.current?.click()}
                      title="Upload Video"
                    >
                      <VideoIcon className={cn("h-4 w-4", isVideoUploading && "animate-pulse")} />
                    </Button>
                  </div>
                  <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsVideoUploading(true);
                      const fd = new FormData();
                      fd.append('file', file);
                      try {
                        const res = await uploadVideoAction(fd);
                        if (res.success) setEditingItem(prev => ({ ...prev!, video_url: res.url }));
                        else alert('Upload failed: ' + res.error);
                      } catch (err) { alert('Upload error'); }
                      finally {
                        setIsVideoUploading(false);
                        if (videoInputRef.current) videoInputRef.current.value = '';
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Supports YouTube/Vimeo links or direct MP4/WebM uploads.</p>
                </div>
              </div>

              <div className="space-y-6">
                {editingItem?.type === 'lecture' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-lg font-bold">Theory Content</Label>
                      <RichTextEditor
                        key={editingItem.id}
                        content={editingItem.theory_content || ''}
                        onChange={(content) => setEditingItem(prev => ({ ...prev!, theory_content: content }))}
                      />
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-center">
                         <div>
                            <h4 className="font-bold text-lg">Table of Contents</h4>
                            <p className="text-xs text-muted-foreground">Manage the navigation links for this lecture.</p>
                         </div>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const auto = extractHeadings(editingItem.theory_content);
                             setEditingItem(prev => ({ ...prev!, content: auto }));
                           }}
                         >
                           Reset to Automatic
                         </Button>
                      </div>

                      <div className="space-y-3">
                        {((Array.isArray(editingItem.content) ? editingItem.content : null) || extractHeadings(editingItem.theory_content)).map((entry: any, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center group">
                            <Badge variant="outline" className="h-6 w-8 flex justify-center p-0">H{entry.level}</Badge>
                            <Input
                              className="h-8 text-sm"
                              value={entry.text}
                              onChange={(e) => {
                                const currentToc = (Array.isArray(editingItem.content) ? editingItem.content : extractHeadings(editingItem.theory_content));
                                const newToc = [...currentToc];
                                newToc[idx] = { ...newToc[idx], text: e.target.value };
                                setEditingItem(prev => ({ ...prev!, content: newToc }));
                              }}
                            />
                            <Input
                              className="h-8 text-xs font-mono w-40"
                              value={entry.id}
                              onChange={(e) => {
                                const currentToc = (Array.isArray(editingItem.content) ? editingItem.content : extractHeadings(editingItem.theory_content));
                                const newToc = [...currentToc];
                                newToc[idx] = { ...newToc[idx], id: e.target.value };
                                setEditingItem(prev => ({ ...prev!, content: newToc }));
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                const currentToc = (Array.isArray(editingItem.content) ? editingItem.content : extractHeadings(editingItem.theory_content));
                                const newToc = currentToc.filter((_: any, i: number) => i !== idx);
                                setEditingItem(prev => ({ ...prev!, content: newToc }));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border-2 border-dashed h-10 mt-2"
                          onClick={() => {
                            const current = (Array.isArray(editingItem.content) ? editingItem.content : extractHeadings(editingItem.theory_content));
                            setEditingItem(prev => ({
                              ...prev!,
                              content: [...current, { text: 'New Link', id: 'new-link', level: 2 }]
                            }));
                          }}
                        >
                          <Plus className="h-3 w-3 mr-2" /> Add Manual Link
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {(editingItem?.type === 'assignment' || editingItem?.type === 'lecture') && (
                   <div className="space-y-4 border-t pt-6">
                      <h4 className="font-bold text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Attached Assignment</h4>
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

        <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingModule?.id ? 'Edit' : 'Add'} Module</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Module Index</Label><Input type="number" value={editingModule?.index || 1} onChange={(e) => setEditingModule(prev => ({ ...prev!, index: parseInt(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Module Name</Label><Input value={editingModule?.name || ''} onChange={(e) => setEditingModule(prev => ({ ...prev!, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description (Optional)</Label><Textarea value={editingModule?.description || ''} onChange={(e) => setEditingModule(prev => ({ ...prev!, description: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveModule(editingModule!)}>Save Module</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingSubModule} onOpenChange={(open) => !open && setEditingSubModule(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSubModule?.id ? 'Edit' : 'Add'} Sub-Module</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Sub-Module Index</Label><Input type="number" value={editingSubModule?.index || 1} onChange={(e) => setEditingSubModule(prev => ({ ...prev!, index: parseInt(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Sub-Module Name</Label><Input value={editingSubModule?.name || ''} onChange={(e) => setEditingSubModule(prev => ({ ...prev!, name: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveSubModule(editingSubModule!)}>Save Sub-Module</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
