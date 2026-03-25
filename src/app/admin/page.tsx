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
  uploadVideoAction,
  saveCourseAction,
  deleteCourseAction,
  adminLogoutAction,
  unlockCourseForStudentAction,
  saveResourceAction,
  deleteResourceAction,
  saveDailyChallengeAction,
  reviewSubmissionAction,
  uploadResourceFileAction
} from './actions';
import { CurriculumItem, QuizQuestion, Module, SubModule, Course, extractHeadings } from '@/lib/curriculum';
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
import { useToast } from '@/components/ui/toast-provider';
import { ExternalLink, Code2, TrendingUp, UserMinus, Target, Hourglass, Library, Trophy, Send, Bot, Github as GithubIcon, MousePointer2, LogIn, MonitorOff } from 'lucide-react';

interface Resource {
  id?: string;
  title: string;
  description: string;
  type: 'book' | 'cheat_sheet' | 'roadmap' | 'note' | 'case_study';
  content?: string;
  external_url?: string;
  thumbnail_url?: string;
  price_points: number;
  is_published: boolean;
}

interface DailyChallenge {
  id?: string;
  title: string;
  description: string;
  initial_code: any;
  test_cases: any;
  difficulty: 'easy' | 'medium' | 'hard';
  points_reward: number;
  active_date: string;
}

interface StudentSubmission {
  id: string;
  curriculum_id: string;
  status: string;
  submitted_at: string;
  github_url: string;
  ai_score?: number;
  ai_feedback?: string;
  ai_status?: string;
}

interface StudentProfile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  submissions: StudentSubmission[];
  student_activity?: any[];
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
  const { success, error: toastError } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [messages, setMessages] = useState<SorryMessage[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [parentCourses, setParentCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'courses' | 'curriculum' | 'attendance' | 'structure' | 'insights' | 'library' | 'challenges'>('students');

  const [extraTaskText, setExtraTaskText] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);
  const [studentTab, setStudentTab] = useState<'submissions' | 'activity'>('submissions');
  const [editingItem, setEditingItem] = useState<Partial<CurriculumItem> | null>(null);
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  const [editingSubModule, setEditingSubModule] = useState<Partial<SubModule> | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Partial<DailyChallenge> | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const resourceFileRef = useRef<HTMLInputElement>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isResourceUploading, setIsResourceUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`*, submissions (*), student_activity (*)`);

    setStudents((profiles as unknown as StudentProfile[]) || []);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    setMessages((msgs as unknown as SorryMessage[]) || []);

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('index', { ascending: true });
    const fetchedCourses = (coursesData as Course[]) || [];
    setCourses(fetchedCourses);
    setParentCourses(fetchedCourses.filter(c => !c.parent_id));

    // Set default selected course if not set
    if (fetchedCourses.length > 0 && !selectedCourseId) {
       setSelectedCourseId(fetchedCourses[0].id);
    }

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

    const { data: resourcesData } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    setResources(resourcesData || []);

    const { data: challengesData } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('active_date', { ascending: false });
    setChallenges(challengesData || []);

    setLoading(false);
  }, [selectedCourseId]);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') router.push('/admin/login');
    else fetchAdminData();
  }, [router, fetchAdminData]);

  const handleSaveCurriculum = async (item: Partial<CurriculumItem>) => {
    if (!item.id) return;
    setIsSaving(true);
    try {
      const res = await saveCurriculumItemAction(item);
      if (res.success) {
        success('Curriculum item saved successfully!');
        setEditingItem(null);
        await fetchAdminData();
      } else {
        toastError('Error saving curriculum: ' + (typeof res.error === 'string' ? res.error : JSON.stringify(res.error)));
      }
    } catch (err) {
      toastError('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModule = async (mod: Partial<Module>) => {
    const res = await saveModuleAction(mod);
    if (res.success) {
      success('Module saved successfully!');
      setEditingModule(null);
      fetchAdminData();
    } else {
      toastError('Error saving module: ' + JSON.stringify(res.error));
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
      success('Sub-module saved successfully!');
      setEditingSubModule(null);
      fetchAdminData();
    } else {
      toastError('Error saving sub-module: ' + JSON.stringify(res.error));
    }
  };

  const handleDeleteSubModule = async (id: string) => {
    if (!confirm('Are you sure? This will affect all lectures in this sub-module.')) return;
    const res = await deleteSubModuleAction(id);
    if (res.success) fetchAdminData();
  };

  const handleSaveCourse = async (course: Partial<Course>) => {
    const res = await saveCourseAction(course);
    if (res.success) {
      success('Course saved successfully!');
      setEditingCourse(null);
      fetchAdminData();
    } else {
      let msg = 'An unknown error occurred.';
      if (typeof res.error === 'object' && (res.error as any).code === '23505') {
        msg = 'The course slug (URL identifier) is already in use by another course. Please choose a unique slug.';
      } else {
        msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
      }
      toastError('Error saving course: ' + msg);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure? This will delete the entire course and all its content.')) return;
    const res = await deleteCourseAction(id);
    if (res.success) fetchAdminData();
  };

  const handleSaveResource = async (res: Partial<Resource>) => {
    const result = await saveResourceAction(res);
    if (result.success) {
      success('Resource saved successfully!');
      setEditingResource(null);
      fetchAdminData();
    } else {
      toastError('Error saving resource: ' + JSON.stringify(result.error));
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const res = await deleteResourceAction(id);
    if (res.success) fetchAdminData();
  };

  const handleSaveChallenge = async (challenge: Partial<DailyChallenge>) => {
    const result = await saveDailyChallengeAction(challenge);
    if (result.success) {
      success('Challenge saved successfully!');
      setEditingChallenge(null);
      fetchAdminData();
    } else {
      toastError('Error saving challenge: ' + JSON.stringify(result.error));
    }
  };

  const handleUnlockCourse = async (email: string, courseId: string) => {
    const res = await unlockCourseForStudentAction(email, courseId);
    if (res.success) {
      success('Course unlocked successfully!');
    } else {
      toastError('Error unlocking course: ' + res.error);
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
              if (res.success) success('Curriculum seeded successfully!');
              else toastError('Error: ' + JSON.stringify(res.error));
            }}>
              <Database className="h-4 w-4 mr-2" /> Seed Curriculum
            </Button>
            <Button variant="outline" onClick={async () => {
              await adminLogoutAction();
              localStorage.removeItem('admin_auth');
              router.push('/admin/login');
            }}>
              Logout Admin
            </Button>
          </div>
        </header>

        <div className="flex gap-4 border-b pb-4 overflow-x-auto">
          <Button variant={activeTab === 'students' ? 'default' : 'ghost'} onClick={() => setActiveTab('students')}><Users className="h-4 w-4 mr-2" /> Students</Button>
          <Button variant={activeTab === 'courses' ? 'default' : 'ghost'} onClick={() => setActiveTab('courses')}><Layers className="h-4 w-4 mr-2" /> Courses</Button>
          <Button variant={activeTab === 'structure' ? 'default' : 'ghost'} onClick={() => setActiveTab('structure')}><Layout className="h-4 w-4 mr-2" /> Structure</Button>
          <Button variant={activeTab === 'curriculum' ? 'default' : 'ghost'} onClick={() => setActiveTab('curriculum')}><BookOpen className="h-4 w-4 mr-2" /> Content</Button>
          <Button variant={activeTab === 'attendance' ? 'default' : 'ghost'} onClick={() => setActiveTab('attendance')}><Clock className="h-4 w-4 mr-2" /> Attendance</Button>
          <Button variant={activeTab === 'library' ? 'default' : 'ghost'} onClick={() => setActiveTab('library')}><Library className="h-4 w-4 mr-2" /> Library</Button>
          <Button variant={activeTab === 'challenges' ? 'default' : 'ghost'} onClick={() => setActiveTab('challenges')}><Trophy className="h-4 w-4 mr-2" /> Challenges</Button>
          <Button variant={activeTab === 'insights' ? 'default' : 'ghost'} onClick={() => setActiveTab('insights')}><TrendingUp className="h-4 w-4 mr-2" /> Insights</Button>
        </div>

        {activeTab === 'courses' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manage Courses</h2>
                <p className="text-sm text-muted-foreground">Add and manage different training programs.</p>
              </div>
              <Button onClick={() => setEditingCourse({ index: courses.length + 1, name: '', slug: '' })}>
                <Plus className="h-4 w-4 mr-2" /> Add Course
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <Card key={course.id} className="overflow-hidden group">
                  <div className="h-32 bg-slate-200 dark:bg-slate-800 relative">
                     {course.thumbnail_url ? (
                       <img src={course.thumbnail_url} alt={course.name} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen className="h-12 w-12" />
                       </div>
                     )}
                     <div className="absolute top-2 right-2 flex gap-1">
                        <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingCourse(course)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg">{course.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description || 'No description provided.'}</p>
                    <div className="flex justify-between items-center mt-4">
                       <Badge variant="outline">{course.slug}</Badge>
                       <span className="text-xs text-muted-foreground font-medium">Index: {course.index}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : activeTab === 'students' ? (
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
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-2xl font-bold">Structure</h2>
                  <p className="text-sm text-muted-foreground">Modules & Sub-Modules.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border">
                   <Label className="pl-3 text-xs font-bold uppercase text-slate-500">Course:</Label>
                   <select
                     className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                     value={selectedCourseId}
                     onChange={(e) => setSelectedCourseId(e.target.value)}
                   >
                     {parentCourses.map(parent => (
                       <optgroup key={parent.id} label={parent.name}>
                         <option value={parent.id}>{parent.name} (Main)</option>
                         {courses.filter(c => c.parent_id === parent.id).map(sub => (
                           <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                         ))}
                       </optgroup>
                     ))}
                     {courses.filter(c => !c.parent_id && !parentCourses.find(pc => pc.id === c.id)).map(standalone => (
                       <option key={standalone.id} value={standalone.id}>{standalone.name}</option>
                     ))}
                   </select>
                </div>
              </div>
              <Button onClick={() => setEditingModule({ course_id: selectedCourseId, index: modules.filter(m => m.course_id === selectedCourseId).length + 1, name: '' })}>
                <Plus className="h-4 w-4 mr-2" /> Add Module
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {modules.filter(m => m.course_id === selectedCourseId).map(mod => (
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
              <div className="flex items-center gap-6">
                <div><h2 className="text-2xl font-bold">Content</h2><p className="text-sm text-muted-foreground">Lectures & Tasks.</p></div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border">
                   <Label className="pl-3 text-xs font-bold uppercase text-slate-500">Course:</Label>
                   <select
                     className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                     value={selectedCourseId}
                     onChange={(e) => setSelectedCourseId(e.target.value)}
                   >
                     {parentCourses.map(parent => (
                       <optgroup key={parent.id} label={parent.name}>
                         <option value={parent.id}>{parent.name} (Main)</option>
                         {courses.filter(c => c.parent_id === parent.id).map(sub => (
                           <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                         ))}
                       </optgroup>
                     ))}
                   </select>
                </div>
              </div>
              <Button onClick={() => {
                const courseModules = modules.filter(m => m.course_id === selectedCourseId).sort((a,b) => a.index - b.index);
                const lastMod = courseModules[courseModules.length - 1];
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
            {modules.filter(m => m.course_id === selectedCourseId).length > 0 ? modules.filter(m => m.course_id === selectedCourseId).map(mod => {
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
        ) : activeTab === 'attendance' ? (
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
        ) : activeTab === 'library' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Library className="h-5 w-5" /> Library Management</h2>
              <Button onClick={() => setEditingResource({ title: '', type: 'book', price_points: 0, is_published: true })}>
                <Plus className="h-4 w-4 mr-2" /> Add Resource
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {resources.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-bold">{res.title}</TableCell>
                      <TableCell><Badge variant="secondary">{res.type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>{res.price_points} pts</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingResource(res)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteResource(res.id!)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : activeTab === 'challenges' ? (
           <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Trophy className="h-5 w-5" /> Daily Challenges</h2>
              <Button onClick={() => setEditingChallenge({ title: '', difficulty: 'easy', points_reward: 50, active_date: new Date().toISOString().split('T')[0] })}>
                <Plus className="h-4 w-4 mr-2" /> Add Challenge
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Difficulty</TableHead><TableHead>Reward</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {challenges.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell>{ch.active_date}</TableCell>
                      <TableCell className="font-bold">{ch.title}</TableCell>
                      <TableCell><Badge variant={ch.difficulty === 'hard' ? 'destructive' : ch.difficulty === 'medium' ? 'default' : 'secondary'}>{ch.difficulty}</Badge></TableCell>
                      <TableCell>{ch.points_reward} pts</TableCell>
                      <TableCell>
                         <Button variant="ghost" size="icon" onClick={() => setEditingChallenge(ch)}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex justify-between items-end">
               <div>
                 <h2 className="text-2xl font-bold">Cohort Insights</h2>
                 <p className="text-sm text-muted-foreground">Performance metrics and student health.</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-500 text-white border-none shadow-xl">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Active Students
                      </CardTitle>
                      <div className="text-3xl font-black">{students.length}</div>
                   </CardHeader>
                   <CardContent className="text-xs opacity-90">Total enrolled across all courses.</CardContent>
                </Card>
                <Card className="bg-emerald-500 text-white border-none shadow-xl">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Check className="h-4 w-4" /> Avg Completion
                      </CardTitle>
                      <div className="text-3xl font-black">
                         {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.submissions?.length || 0), 0) / (students.length * curriculum.length || 1) * 100) : 0}%
                      </div>
                   </CardHeader>
                   <CardContent className="text-xs opacity-90">Average progress per student.</CardContent>
                </Card>
                <Card className="bg-purple-600 text-white border-none shadow-xl">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Total Submissions
                      </CardTitle>
                      <div className="text-3xl font-black">{students.reduce((acc, s) => acc + (s.submissions?.length || 0), 0)}</div>
                   </CardHeader>
                   <CardContent className="text-xs opacity-90">Total assignments & quizzes turned in.</CardContent>
                </Card>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                   <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                        <UserMinus className="h-5 w-5" /> At Risk Students
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Students with 0 submissions in the last 7 days.</p>
                   </CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                         {students.filter(s => {
                            const lastSub = s.submissions?.[s.submissions.length - 1]?.submitted_at;
                            if (!lastSub) return true;
                            return new Date().getTime() - new Date(lastSub).getTime() > 7 * 24 * 60 * 60 * 1000;
                         }).slice(0, 5).map(s => (
                           <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                              <div className="font-bold text-sm">{s.full_name}</div>
                              <Badge variant="destructive" className="text-[10px]">INACTIVE</Badge>
                           </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                        <Hourglass className="h-5 w-5" /> Top Bottlenecks
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Lectures with the fewest completions.</p>
                   </CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                         {curriculum.slice(0, 5).map(item => {
                            const completionCount = students.filter(s => s.submissions?.some(sub => sub.curriculum_id === item.id)).length;
                            return (
                              <div key={item.id} className="space-y-2">
                                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                    <span className="truncate max-w-[200px]">{item.title}</span>
                                    <span>{completionCount}/{students.length} DONE</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${(completionCount / (students.length || 1)) * 100}%` }}
                                    />
                                 </div>
                              </div>
                            )
                         })}
                      </div>
                   </CardContent>
                </Card>
             </div>
          </div>
        )}

        <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
               <div className="flex justify-between items-center pr-8">
                  <DialogTitle>Student Profile: {viewingStudent?.full_name}</DialogTitle>
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                     <Button
                        variant={studentTab === 'submissions' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-xs font-bold"
                        onClick={() => setStudentTab('submissions')}
                     >Submissions</Button>
                     <Button
                        variant={studentTab === 'activity' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-xs font-bold"
                        onClick={() => setStudentTab('activity')}
                     >Activity Log</Button>
                  </div>
               </div>
            </DialogHeader>

            <div className="py-4">
              {studentTab === 'submissions' ? (
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tighter"><Send className="h-5 w-5" /> Recent Submissions</h3>
                    <div className="grid grid-cols-1 gap-4">
                       {viewingStudent?.submissions?.sort((a,b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).map((sub) => (
                         <Card key={sub.id} className="overflow-hidden">
                            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900 flex flex-row justify-between items-center border-b">
                               <div className="flex gap-2 items-center">
                                  <Badge variant="outline">{sub.curriculum_id}</Badge>
                                  <span className="text-xs font-bold text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</span>
                               </div>
                               <div className="flex gap-2">
                                  {sub.github_url && <Button size="sm" variant="outline" asChild><a href={sub.github_url} target="_blank"><GithubIcon className="h-3 w-3 mr-2" /> Repo</a></Button>}
                                  <Badge className={cn(
                                    sub.status === 'reviewed' ? 'bg-green-600' : 'bg-amber-500'
                                  )}>{sub.status.toUpperCase()}</Badge>
                               </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                     <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">AI Feedback & Grade</Label>
                                     <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs font-medium italic min-h-[60px]">
                                        {sub.ai_feedback || "No AI feedback yet. Grade this submission to trigger AI review."}
                                     </div>
                                  </div>
                                  <div className="flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                                     <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">AI Score</div>
                                     <div className="text-4xl font-black text-primary">{sub.ai_score || 0}<span className="text-lg text-muted-foreground">/100</span></div>
                                  </div>
                               </div>
                               <div className="flex justify-end gap-2 border-t pt-4">
                                  <Button variant="outline" size="sm" onClick={async () => {
                                     const res = await reviewSubmissionAction(sub.id, "Excellent work! Your code is clean and follows best practices.", 95, 'passed');
                                     if (res.success) {
                                        success('AI Review generated!');
                                        fetchAdminData();
                                     }
                                  }}>
                                    <Bot className="h-3 w-3 mr-2" /> Mock AI Grade
                                  </Button>
                               </div>
                            </CardContent>
                         </Card>
                       ))}
                    </div>
                 </div>
              ) : (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tighter"><MousePointer2 className="h-5 w-5" /> Activity Timeline</h3>
                       <Badge variant="outline">{viewingStudent?.student_activity?.length || 0} Events Logged</Badge>
                    </div>

                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 space-y-8">
                       {viewingStudent?.student_activity?.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((act: any) => (
                         <div key={act.id} className="relative">
                            <div className={cn(
                               "absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center",
                               act.activity_type === 'login' ? "bg-blue-500" :
                               act.activity_type === 'tab_switch' ? "bg-orange-500" : "bg-emerald-500"
                            )}>
                               {act.activity_type === 'login' ? <LogIn className="h-3 w-3 text-white" /> :
                                act.activity_type === 'tab_switch' ? <MonitorOff className="h-3 w-3 text-white" /> :
                                <MousePointer2 className="h-3 w-3 text-white" />}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <span className="text-xs font-black uppercase tracking-widest text-primary">{act.activity_type.replace('_', ' ')}</span>
                                     <h4 className="font-bold text-sm">{act.page_url || '/'}</h4>
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">{new Date(act.created_at).toLocaleString()}</span>
                               </div>
                               {act.details && Object.keys(act.details).length > 0 && (
                                  <div className="text-[10px] bg-white dark:bg-black p-2 rounded border font-mono opacity-80">
                                     {JSON.stringify(act.details)}
                                  </div>
                               )}
                            </div>
                         </div>
                       ))}
                       {!viewingStudent?.student_activity?.length && (
                          <div className="text-center py-12 text-muted-foreground italic">No activity recorded yet.</div>
                       )}
                    </div>
                 </div>
              )}
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
                        if (res.success) {
                          success('Video uploaded successfully!');
                          setEditingItem(prev => ({ ...prev!, video_url: res.url }));
                        }
                        else toastError('Upload failed: ' + res.error);
                      } catch (err) { toastError('Upload error'); }
                      finally {
                        setIsVideoUploading(false);
                        if (videoInputRef.current) videoInputRef.current.value = '';
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Supports YouTube/Vimeo links or direct MP4/WebM uploads.</p>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                     <Label className="flex items-center gap-2"><Code2 className="h-4 w-4" /> Code Compiler</Label>
                     <input
                       type="checkbox"
                       checked={editingItem?.enable_compiler || false}
                       onChange={(e) => setEditingItem(prev => ({ ...prev!, enable_compiler: e.target.checked }))}
                     />
                  </div>
                  {editingItem?.enable_compiler && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                       <Label className="text-[10px] font-bold uppercase text-muted-foreground">Initial HTML Code</Label>
                       <Textarea
                         className="font-mono text-xs h-24"
                         value={editingItem?.compiler_initial_code?.html || ''}
                         onChange={(e) => setEditingItem(prev => ({ ...prev!, compiler_initial_code: { ...prev!.compiler_initial_code!, html: e.target.value } }))}
                       />
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t pt-4">
                   <Label className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> External Resources</Label>
                   <div className="space-y-2">
                      {editingItem?.external_resources?.map((res, i) => (
                        <div key={i} className="flex gap-2 items-center">
                           <Input
                             placeholder="Title"
                             className="flex-1 h-8 text-xs"
                             value={res.title}
                             onChange={(e) => {
                               const newRes = [...(editingItem.external_resources || [])];
                               newRes[i].title = e.target.value;
                               setEditingItem(prev => ({ ...prev!, external_resources: newRes }));
                             }}
                           />
                           <Input
                             placeholder="URL"
                             className="flex-1 h-8 text-xs"
                             value={res.url}
                             onChange={(e) => {
                               const newRes = [...(editingItem.external_resources || [])];
                               newRes[i].url = e.target.value;
                               setEditingItem(prev => ({ ...prev!, external_resources: newRes }));
                             }}
                           />
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-8 w-8 text-destructive"
                             onClick={() => {
                                const newRes = editingItem.external_resources?.filter((_, idx) => idx !== i);
                                setEditingItem(prev => ({ ...prev!, external_resources: newRes }));
                             }}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[10px] h-8"
                        onClick={() => setEditingItem(prev => ({
                           ...prev!,
                           external_resources: [...(prev!.external_resources || []), { title: '', url: '', type: 'link' }]
                        }))}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Resource
                      </Button>
                   </div>
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
                            <select
                              className="h-8 text-[10px] font-bold border rounded bg-transparent px-1 outline-none w-14 shrink-0"
                              value={entry.level}
                              onChange={(e) => {
                                const currentToc = (Array.isArray(editingItem.content) ? editingItem.content : extractHeadings(editingItem.theory_content));
                                const newToc = [...currentToc];
                                newToc[idx] = { ...newToc[idx], level: parseInt(e.target.value) };
                                setEditingItem(prev => ({ ...prev!, content: newToc }));
                              }}
                            >
                              <option value={1}>H1</option>
                              <option value={2}>H2</option>
                              <option value={3}>H3</option>
                            </select>
                            <Input
                              className={cn(
                                "h-8 text-sm transition-all",
                                entry.level === 2 && "ml-4 border-l-4 border-l-slate-200",
                                entry.level === 3 && "ml-8 border-l-4 border-l-slate-400"
                              )}
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
            <DialogFooter>
              <Button disabled={isSaving} onClick={() => handleSaveCurriculum(editingItem!)}>
                {isSaving ? 'Saving...' : 'Save Curriculum Item'}
              </Button>
            </DialogFooter>
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

        <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCourse?.id ? 'Edit' : 'Add'} Course</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Course Name</Label><Input value={editingCourse?.name || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={editingCourse?.slug || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, slug: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Parent Course (Optional)</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingCourse?.parent_id || ''}
                  onChange={(e) => setEditingCourse(prev => ({ ...prev!, parent_id: e.target.value || undefined }))}
                >
                  <option value="">No Parent (This is a Parent Course)</option>
                  {parentCourses.filter(c => c.id !== editingCourse?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2"><Label>Index</Label><Input type="number" value={editingCourse?.index || 1} onChange={(e) => setEditingCourse(prev => ({ ...prev!, index: parseInt(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingCourse?.description || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Thumbnail URL (Optional)</Label><Input value={editingCourse?.thumbnail_url || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, thumbnail_url: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveCourse(editingCourse!)}>Save Course</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
          <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingResource?.id ? 'Edit' : 'Add'} Library Resource</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full p-2 border rounded" value={editingResource?.type} onChange={(e) => setEditingResource(prev => ({ ...prev!, type: e.target.value as any }))}>
                    <option value="book">Book</option>
                    <option value="cheat_sheet">Cheat Sheet</option>
                    <option value="roadmap">Roadmap</option>
                    <option value="note">Note</option>
                    <option value="case_study">Case Study</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Price (Skill Points)</Label><Input type="number" value={editingResource?.price_points} onChange={(e) => setEditingResource(prev => ({ ...prev!, price_points: parseInt(e.target.value) }))} /></div>
              </div>
              <div className="space-y-2"><Label>Title</Label><Input value={editingResource?.title} onChange={(e) => setEditingResource(prev => ({ ...prev!, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingResource?.description} onChange={(e) => setEditingResource(prev => ({ ...prev!, description: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Resource URL or Upload</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    className="flex-1"
                    value={editingResource?.external_url || ''}
                    onChange={(e) => setEditingResource(prev => ({ ...prev!, external_url: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isResourceUploading}
                    onClick={() => resourceFileRef.current?.click()}
                    title="Upload File"
                  >
                    <FilePlus className={cn("h-4 w-4", isResourceUploading && "animate-pulse")} />
                  </Button>
                </div>
                <input
                  type="file"
                  ref={resourceFileRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsResourceUploading(true);
                    const fd = new FormData();
                    fd.append('file', file);
                    try {
                      const res = await uploadResourceFileAction(fd);
                      if (res.success) {
                        success('Resource uploaded successfully!');
                        setEditingResource(prev => ({ ...prev!, external_url: res.url }));
                      }
                      else toastError('Upload failed: ' + res.error);
                    } catch (err) { toastError('Upload error'); }
                    finally {
                      setIsResourceUploading(false);
                      if (resourceFileRef.current) resourceFileRef.current.value = '';
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Upload PDF, Image, Word, etc.</p>
              </div>
              <div className="space-y-2">
                <Label>Content (Markdown/HTML)</Label>
                <RichTextEditor content={editingResource?.content || ''} onChange={(c) => setEditingResource(prev => ({ ...prev!, content: c }))} />
              </div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveResource(editingResource!)}>Save Resource</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingChallenge} onOpenChange={(open) => !open && setEditingChallenge(null)}>
          <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingChallenge?.id ? 'Edit' : 'Add'} Daily Challenge</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Active Date</Label><Input type="date" value={editingChallenge?.active_date} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, active_date: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Difficulty</Label>
                  <select className="w-full p-2 border rounded" value={editingChallenge?.difficulty} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, difficulty: e.target.value as any }))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Points Reward</Label><Input type="number" value={editingChallenge?.points_reward} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, points_reward: parseInt(e.target.value) }))} /></div>
              </div>
              <div className="space-y-2"><Label>Title</Label><Input value={editingChallenge?.title} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingChallenge?.description} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, description: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Initial Code (JSON)</Label>
                <Textarea
                  className="font-mono text-xs"
                  value={JSON.stringify(editingChallenge?.initial_code || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingChallenge(prev => ({ ...prev!, initial_code: JSON.parse(e.target.value) }));
                    } catch(err) {
                      console.error("Invalid JSON for Initial Code:", err);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Test Cases (JSON)</Label>
                <Textarea
                  className="font-mono text-xs"
                  value={JSON.stringify(editingChallenge?.test_cases || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingChallenge(prev => ({ ...prev!, test_cases: JSON.parse(e.target.value) }));
                    } catch(err) {
                      console.error("Invalid JSON for Test Cases:", err);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveChallenge(editingChallenge!)}>Save Challenge</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
