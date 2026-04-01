/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { VideoCallRoom } from '@/components/video-call-room';
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
  Clock,
  Plus,
  Search,
  FileText,
  Database,
  BookOpen,
  Edit,
  Trash2,
  FilePlus,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  Layout,
  Video as VideoIcon,
  PhoneCall,
  Calendar,
  SendHorizontal,
  X,
  CheckCheck,
  Paperclip,
  ImageIcon,
  Download
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
  sendChatMessageAction,
  fetchChatMessagesAction,
  markMessagesAsReadAction,
  getUnreadCountsAction,
  createNotificationAction,
  deleteCourseAction,
  getAdminDataAction,
  adminLogoutAction,
  saveResourceAction,
  deleteResourceAction,
  saveDailyChallengeAction,
  reviewSubmissionAction,
  uploadResourceFileAction,
  uploadImageAction
} from './actions';
import { CurriculumItem, Module, SubModule, Course, extractHeadings } from '@/lib/curriculum';
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
import { ExternalLink, Code2, TrendingUp, UserMinus, Hourglass, Library, Trophy, Send, Bot, Github as GithubIcon, MousePointer2, LogIn, MonitorOff, Check } from 'lucide-react';

interface Resource {
  id?: string;
  title: string;
  description: string;
  type: 'book' | 'cheat_sheet' | 'roadmap' | 'note' | 'case_study';
  external_url?: string;
  thumbnail_url?: string;
  price_points: number;
  is_published: boolean;
}

interface DailyChallenge {
  id?: string;
  title: string;
  description: string;
  initial_code: Record<string, unknown>;
  test_cases: Record<string, unknown>[];
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
  ai_sections?: {
    theory?: { score: number; feedback: string };
    knowledge_check?: { score: number; feedback: string };
    assignment?: { score: number; feedback: string };
    quiz?: { score: number; feedback: string };
  };
  ai_mistakes?: string[];
  ai_improvements?: string[];
  completion_data?: {
    theory_read?: boolean;
    quiz_completed?: boolean;
    quiz_score?: number;
    quiz_answers?: number[];
    assignment_submitted?: boolean;
    knowledge_check_answers?: Record<string, string>;
  };
}

interface StudentProfile {
  id: string;
  full_name: string;
  enrollment_date: string;
  is_pro: boolean;
  submissions: StudentSubmission[];
  student_activity?: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [manualFeedback, setManualFeedback] = useState<Record<string, string>>({});
  const [manualStatus, setManualStatus] = useState<Record<string, string>>({});
  const [aiReviewData, setAiReviewData] = useState<Record<string, any>>({});
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [parentCourses, setParentCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'courses' | 'curriculum' | 'attendance' | 'structure' | 'insights' | 'library' | 'challenges' | 'support'>('students');

  const [selectedChatStudent, setSelectedChatStudent] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, unknown>[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [newChatInput, setNewChatInput] = useState('');
  const [adminId, setAdminId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [studentVideoSessions, setStudentVideoSessions] = useState<Record<string, unknown>[]>([]);
  const [ringingSession, setRingingSession] = useState<Record<string, unknown> | null>(null);
  const [activeCallSessionId, setActiveCallSessionId] = useState<string | null>(null);
  const [typingStudents, setTypingStudents] = useState<Record<string, boolean>>({});
  const [onlineStudents, setOnlineStudents] = useState<Record<string, boolean>>({});
  const [studentMetadata, setStudentMetadata] = useState<Record<string, any>>({});
  const [isChatUploading, setIsChatUploading] = useState(false);
  const chatChannelRef = useRef<any>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
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
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isResourceUploading, setIsResourceUploading] = useState(false);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [fetchedCode, setFetchedCode] = useState<Record<string, string> | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isFetchingCode, setIsFetchingCode] = useState(false);

  const fetchGitHubCode = async (githubUrl: string) => {
    setIsFetchingCode(true);
    setFetchedCode(null);
    try {
      const url = new URL(githubUrl);
      if (url.hostname !== 'github.com') return;

      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return;

      const [owner, repo] = parts;
      const branches = ['main', 'master'];
      const filesToTry = ['index.html', 'style.css', 'script.js', 'App.tsx', 'App.jsx', 'README.md'];

      let branch = 'main';
      const contents: Record<string, string> = {};

      // Try to find the correct branch
      for (const b of branches) {
        const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${b}/README.md`);
        if (res.ok) {
          branch = b;
          break;
        }
      }

      // Fetch files
      for (const file of filesToTry) {
        const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`);
        if (res.ok) {
          contents[file] = await res.text();
        }
      }
      setFetchedCode(contents);
      if (Object.keys(contents).length > 0) {
        setSelectedFile(Object.keys(contents)[0]);
      }
    } catch (err) {
      console.error("Error fetching code:", err);
    } finally {
      setIsFetchingCode(false);
    }
  };

  useEffect(() => {
     audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  }, []);

  const fetchVideoSessions = useCallback(async (studentId: string) => {
    const { data } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('scheduled_at', { ascending: false });
    if (data) setStudentVideoSessions(data as Record<string, unknown>[]);
  }, []);

  const fetchChat = useCallback(async (studentId: string) => {
    if (!adminId) return;
    const res = await fetchChatMessagesAction(studentId, adminId);
    if (res.success && res.data) {
       setChatMessages(res.data as Record<string, unknown>[]);
       // Mark as read when fetching
       await markMessagesAsReadAction(studentId, adminId);
       // Refresh unread counts
       const countsRes = await getUnreadCountsAction(adminId);
       if (countsRes.success && countsRes.data) setUnreadCounts(countsRes.data as Record<string, number>);
    }
    fetchVideoSessions(studentId);
  }, [adminId, fetchVideoSessions]);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    const res = await getAdminDataAction();

    // Use the fixed System Admin ID for chat & video sessions by default
    // This ensures consistency even if the admin is using a student account for auth
    const fixedAdminId = '00000000-0000-0000-0000-000000000000';
    setAdminId(fixedAdminId);

    // Initial unread counts
    const countsRes = await getUnreadCountsAction(fixedAdminId);
    if (countsRes.success && countsRes.data) setUnreadCounts(countsRes.data as Record<string, number>);

    if (res.success && res.data) {
      const {
        profiles,
        courses: coursesData,
        curriculum: curriculumData,
        modules: modulesData,
        subModules: subModulesData,
        attendance: attendanceData,
        resources: resourcesData,
        challenges: challengesData
      } = res.data as {
        profiles: StudentProfile[];
        courses: Course[];
        curriculum: CurriculumItem[];
        modules: Module[];
        subModules: SubModule[];
        attendance: Record<string, unknown>[];
        resources: Resource[];
        challenges: DailyChallenge[];
      };

      setStudents(profiles);

      const fetchedCourses = coursesData || [];
      setCourses(fetchedCourses);
      setParentCourses(fetchedCourses.filter(c => !c.parent_id));

      if (fetchedCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(fetchedCourses[0].id);
      }

      setCurriculum(curriculumData);
      setModules(modulesData);
      setSubModules(subModulesData);
      setAttendance(attendanceData);
      setResources(resourcesData);
      setChallenges(challengesData);
    } else {
      toastError('Error fetching admin data: ' + (typeof res.error === 'string' ? res.error : 'Unknown error'));
    }

    setLoading(false);
  }, [selectedCourseId, toastError]);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') router.push('/admin/login');
    else {
      fetchAdminData();

      // Request browser notification permission
      if (typeof window !== 'undefined' && "Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      const chatChannel = supabase
        .channel('support_presence', {
           config: {
              presence: {
                 key: adminId,
              },
           },
        })
        .on('presence', { event: 'sync' }, () => {
           const state = chatChannel.presenceState();
           const typing: Record<string, boolean> = {};
           const online: Record<string, boolean> = {};
           const metadata: Record<string, any> = {};
           Object.keys(state).forEach(uid => {
              const userState = state[uid];
              if (userState && Array.isArray(userState)) {
                 online[uid] = true;
                 metadata[uid] = userState[userState.length - 1];
                 if (userState.some((s: any) => s.isTyping && s.typingTo === adminId)) {
                    typing[uid] = true;
                 }
              }
           });
           setTypingStudents(typing);
           setOnlineStudents(online);
           setStudentMetadata(metadata);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
           // Track when student reads our messages
           const msg = payload.new as Record<string, unknown>;
           if (selectedChatStudent && (msg.sender_id === adminId && msg.receiver_id === selectedChatStudent)) {
              setChatMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
           }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
          // Refresh unread counts for all student list items
          const countsRes = await getUnreadCountsAction(adminId);
          if (countsRes.success && countsRes.data) setUnreadCounts(countsRes.data as Record<string, number>);

          // If the message is for the currently open chat, refresh messages
          const newMsg = payload.new as Record<string, unknown>;

          // Browser Notification for new messages from students
          if (newMsg.receiver_id === adminId) {
             audioRef.current?.play().catch(() => {});
             if (!document.hasFocus()) {
                const student = students.find(s => s.id === newMsg.sender_id);
                if ("Notification" in window && Notification.permission === "granted") {
                   new Notification(`New Message from ${student?.full_name || 'Student'}`, {
                      body: (newMsg.content as string).substring(0, 100)
                   });
                }
             }
          }

          if (selectedChatStudent && (newMsg.sender_id === selectedChatStudent || newMsg.receiver_id === selectedChatStudent)) {
             fetchChat(selectedChatStudent);
          }
        })
        .subscribe();

      // Track our own presence immediately
      chatChannel.subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
            await chatChannel.track({
               online_at: new Date().toISOString(),
               last_seen: new Date().toISOString()
            });
         }
      });

      chatChannelRef.current = chatChannel;

      const videoChannel = supabase
        .channel('admin_video_calls')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'video_sessions' }, (payload: { new: Record<string, unknown>; old?: Record<string, unknown> }) => {
          if (payload.new && payload.new.is_ringing && !payload.old?.is_ringing) {
             setRingingSession(payload.new);
          }
          if (selectedChatStudent) fetchVideoSessions(selectedChatStudent);
        })
        .subscribe();

      // Polling fallback for chat updates (every 10 seconds)
      const pollInterval = setInterval(async () => {
        if (activeTab === 'support') {
          const countsRes = await getUnreadCountsAction(adminId);
          if (countsRes.success && countsRes.data) setUnreadCounts(countsRes.data as Record<string, number>);

          if (selectedChatStudent) {
            const res = await fetchChatMessagesAction(selectedChatStudent, adminId);
            if (res.success && res.data) setChatMessages(res.data as Record<string, unknown>[]);
          }
        }
      }, 10000);

      return () => {
        supabase.removeChannel(chatChannel);
        supabase.removeChannel(videoChannel);
        clearInterval(pollInterval);
      };
    }
  }, [router, fetchAdminData, selectedChatStudent, fetchChat, fetchVideoSessions, activeTab, adminId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);


  const updateVideoStatus = async (sessionId: string, status: string) => {
    await supabase.from('video_sessions').update({ status, admin_id: adminId }).eq('id', sessionId);
    if (selectedChatStudent) await fetchVideoSessions(selectedChatStudent);
  };

  const handleTyping = (val: string) => {
     setNewChatInput(val);
     if (chatChannelRef.current) {
        if (val.trim() && selectedChatStudent) {
           chatChannelRef.current.track({
              isTyping: true,
              typingTo: selectedChatStudent,
              last_seen: new Date().toISOString()
           });
        } else {
           chatChannelRef.current.track({
              isTyping: false,
              last_seen: new Date().toISOString()
           });
        }
     }
  };

  const formatTimeAgo = (date: string | null | undefined) => {
    if (!date) return 'Offline';
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !selectedChatStudent || !adminId) return;

     setIsChatUploading(true);
     const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

     try {
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, file);

        if (uploadError) {
           toastError('Upload failed: ' + uploadError.message);
           return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        // Send a message with the attachment URL
        handleSendChat(publicUrl);
     } catch (err) {
        toastError('Unexpected upload error');
     } finally {
        setIsChatUploading(false);
        if (chatFileRef.current) chatFileRef.current.value = '';
     }
  };

  const handleSendChat = async (customContent?: string) => {
    const content = customContent || newChatInput.trim();
    if (!content || !selectedChatStudent || !adminId) return;

    // Optimistic Update
    const tempId = Math.random().toString(36).substring(7);
    const optimisticMsg = {
      id: tempId,
      sender_id: adminId,
      receiver_id: selectedChatStudent,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setNewChatInput('');

    const res = await sendChatMessageAction(adminId, selectedChatStudent, content);

    if (!res.success) {
       toastError('Failed to send message: ' + (typeof res.error === 'string' ? res.error : (res.error as Error)?.message || JSON.stringify(res.error)));
       // Rollback
       setChatMessages(prev => prev.filter(m => m.id !== tempId));
       return;
    }

    // Replace optimistic with real
    if (res.data) {
       setChatMessages(prev => prev.map(m => m.id === tempId ? (res.data as Record<string, unknown>) : m));
    }

    // Notify Student via Server Action (bypasses RLS)
    await createNotificationAction(
       selectedChatStudent,
       'New Message from Admin',
       'An instructor has replied to your query.',
       'info'
    );

    fetchChat(selectedChatStudent);
  };

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
    } catch {
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
      const errorObj = res.error as Record<string, unknown> | null;
      if (errorObj && typeof errorObj === 'object' && errorObj.code === '23505') {
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


  const handleDeleteCurriculum = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const res = await deleteCurriculumItemAction(id);
    if (res.success) fetchAdminData();
  };

  const moveItem = async (item: CurriculumItem, direction: 'up' | 'down') => {
    const moduleItems = curriculum
      .filter(i => (i.module_id && i.module_id === item.module_id) || (!i.module_id && i.week === item.week && i.course_id === item.course_id))
      .sort((a, b) => (a.lecture_index || 0) - (b.lecture_index || 0));
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {activeCallSessionId && adminId && (
         <VideoCallRoom
           sessionId={activeCallSessionId}
           userId={adminId}
           onClose={() => setActiveCallSessionId(null)}
         />
      )}
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-slate-500">Manage students and curriculum progression.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={async () => {
              const res = await seedCurriculumAction();
              if (res.success) success('Curriculum seeded successfully!');
              else toastError('Error: ' + JSON.stringify(res.error));
            }}>
              <Database className="h-4 w-4 mr-2" /> Seed
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              await adminLogoutAction();
              localStorage.removeItem('admin_auth');
              router.push('/admin/login');
            }}>
              Logout
            </Button>
          </div>
        </header>

        <div className="flex gap-2 border-b pb-4 overflow-x-auto no-scrollbar scroll-smooth">
          <Button variant={activeTab === 'students' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('students')}><Users className="h-4 w-4 mr-1 md:mr-2" /> Students</Button>
          <Button variant={activeTab === 'courses' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('courses')}><Layers className="h-4 w-4 mr-1 md:mr-2" /> Courses</Button>
          <Button variant={activeTab === 'structure' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('structure')}><Layout className="h-4 w-4 mr-1 md:mr-2" /> Structure</Button>
          <Button variant={activeTab === 'curriculum' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('curriculum')}><BookOpen className="h-4 w-4 mr-1 md:mr-2" /> Content</Button>
          <Button variant={activeTab === 'attendance' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('attendance')}><Clock className="h-4 w-4 mr-1 md:mr-2" /> Attendance</Button>
          <Button variant={activeTab === 'library' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('library')}><Library className="h-4 w-4 mr-1 md:mr-2" /> Library</Button>
          <Button variant={activeTab === 'challenges' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('challenges')}><Trophy className="h-4 w-4 mr-1 md:mr-2" /> Challenges</Button>
          <Button variant={activeTab === 'support' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('support')}><MessageCircle className="h-4 w-4 mr-1 md:mr-2" /> Support</Button>
          <Button variant={activeTab === 'insights' ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap shrink-0" onClick={() => setActiveTab('insights')}><TrendingUp className="h-4 w-4 mr-1 md:mr-2" /> Insights</Button>
        </div>

        <Dialog open={!!ringingSession} onOpenChange={(o) => !o && setRingingSession(null)}>
          <DialogContent className="sm:max-w-[425px] bg-emerald-600 text-white border-none shadow-2xl">
             <div className="flex flex-col items-center py-12 space-y-8">
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                   <PhoneCall className="h-12 w-12" />
                </div>
                <div className="text-center">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Incoming Call</h2>
                   <p className="opacity-80 font-bold">{students.find(s => s.id === ringingSession?.student_id)?.full_name} is ringing...</p>
                </div>
                <div className="flex gap-4 w-full px-4">
                   <Button
                    className="flex-1 h-14 bg-white text-emerald-600 hover:bg-slate-100 font-black uppercase tracking-widest text-xs"
                    onClick={() => {
                        if (ringingSession) {
                          setActiveCallSessionId(ringingSession.id as string);
                          setRingingSession(null);
                        }
                    }}
                   >
                     Accept Call
                   </Button>
                   <Button
                    variant="ghost"
                    className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs border-none"
                    onClick={async () => {
                       if (ringingSession) {
                         await updateVideoStatus(ringingSession.id as string, 'missed');
                         await supabase.from('video_sessions').update({ is_ringing: false }).eq('id', ringingSession.id);
                         setRingingSession(null);
                       }
                    }}
                   >
                     Decline
                   </Button>
                </div>
             </div>
          </DialogContent>
        </Dialog>

        {activeTab === 'support' ? (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 h-auto md:h-[700px]">
              <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border flex flex-col overflow-hidden h-[300px] md:h-auto">
                 <div className="p-4 border-b">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Chat History</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {students.map((s: StudentProfile) => (
                       <button
                         key={s.id}
                         onClick={() => {
                            setSelectedChatStudent(s.id);
                            fetchChat(s.id);
                         }}
                         className={cn(
                            "w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0 text-left relative",
                            selectedChatStudent === s.id && "bg-primary/5 border-r-4 border-r-primary"
                         )}
                       >
                          <div className="relative">
                             <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold">{s.full_name[0]}</div>
                             {onlineStudents[s.id] && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="font-bold text-sm truncate">{s.full_name}</div>
                             <div className="text-[10px] text-muted-foreground truncate italic">
                                {onlineStudents[s.id] ? (
                                   <span className="text-emerald-500 font-bold">Online</span>
                                ) : (
                                   <span>Active {formatTimeAgo((s as any).last_seen)}</span>
                                )}
                             </div>
                          </div>
                          {unreadCounts[s.id] > 0 && (
                             <Badge className="absolute top-4 right-4 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-red-600">
                                {unreadCounts[s.id]}
                             </Badge>
                          )}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border flex flex-col overflow-hidden">
                 {selectedChatStudent ? (
                    <>
                       <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3">
                             <div className="relative">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">{students.find(s => s.id === selectedChatStudent)?.full_name[0]}</div>
                                {onlineStudents[selectedChatStudent] && (
                                   <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                                )}
                             </div>
                             <div>
                                <h3 className="font-bold leading-none">{students.find(s => s.id === selectedChatStudent)?.full_name}</h3>
                                {onlineStudents[selectedChatStudent] ? (
                                   <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">Online</span>
                                ) : (
                                   <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                      Active {formatTimeAgo((students.find(s => s.id === selectedChatStudent) as any)?.last_seen)}
                                   </span>
                                )}
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Dialog>
                                <DialogTrigger asChild>
                                   <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tighter"><Calendar className="h-3 w-3 mr-2" /> Sessions</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                   <DialogHeader><DialogTitle>Video Sessions: {students.find(s => s.id === selectedChatStudent)?.full_name}</DialogTitle></DialogHeader>
                                   <div className="space-y-4 py-4">
                                      {studentVideoSessions.length === 0 ? (
                                         <p className="text-center text-sm text-muted-foreground py-8">No session requests found.</p>
                                      ) : studentVideoSessions.map(session => (
                                         <div key={session.id as string} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                            <div>
                                               <p className="font-bold text-sm">{new Date(session.scheduled_at as string).toLocaleString()}</p>
                                               <Badge variant={session.status === 'approved' ? 'default' : session.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                  {(session.status as string).toUpperCase()}
                                               </Badge>
                                            </div>
                                            {session.status === 'requested' && (
                                               <div className="flex gap-1">
                                                  <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => updateVideoStatus(session.id as string, 'approved')}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                                                  <Button size="sm" variant="ghost" className="h-8 text-[10px] text-destructive" onClick={() => updateVideoStatus(session.id as string, 'rejected')}><X className="h-3 w-3 mr-1" /> Reject</Button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                   </div>
                                </DialogContent>
                             </Dialog>
                             <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-[10px] font-black uppercase tracking-tighter bg-emerald-600 hover:bg-emerald-700"
                              onClick={async () => {
                                 if (!selectedChatStudent) return;
                                 // Check if there's an active session first, or just create an ad-hoc one
                                 let session = studentVideoSessions.find(s => {
                                    const now = new Date();
                                    const start = new Date(s.scheduled_at as string);
                                    const end = s.scheduled_at ? new Date(new Date(s.scheduled_at as string).getTime() + 60 * 60 * 1000) : null;
                                    return s.status === 'approved' && now >= start && end && now <= end;
                                 });

                                 if (!session) {
                                    const now = new Date();
                                    const { data } = await supabase.from('video_sessions').insert({
                                       student_id: selectedChatStudent,
                                       admin_id: adminId,
                                       scheduled_at: now.toISOString(),
                                       end_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
                                       status: 'approved',
                                       is_ringing: true
                                    }).select().single();
                                    if (data) session = data as Record<string, unknown>;
                                 } else {
                                    await supabase.from('video_sessions').update({ is_ringing: true }).eq('id', session.id as string);
                                 }

                                 if (session) setActiveCallSessionId(session.id as string);
                              }}
                             >
                                <PhoneCall className="h-3 w-3 mr-2" /> Start Call
                             </Button>
                          </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={chatScrollRef}>
                          {chatMessages.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <MessageCircle className="h-12 w-12 mb-2" />
                                <p className="text-sm font-bold">No messages yet with this student.</p>
                             </div>
                          ) : (
                             <>
                             {chatMessages.map(msg => (
                                <div key={msg.id as string} className={cn(
                                   "flex flex-col max-w-[70%]",
                                   msg.sender_id === adminId ? "ml-auto items-end" : "items-start"
                                )}>
                                   <div className={cn(
                                      "p-3 rounded-2xl text-sm font-medium shadow-sm",
                                      msg.sender_id === adminId ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-tl-none border"
                                   )}>
                                      {(msg.content as string).startsWith('https://') && (msg.content as string).includes('chat-attachments') ? (
                                         <div className="space-y-2">
                                            {(msg.content as string).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                               <img
                                                  src={msg.content as string}
                                                  alt="Attachment"
                                                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-60"
                                                  onClick={() => window.open(msg.content as string, '_blank')}
                                               />
                                            ) : (
                                               <a
                                                  href={msg.content as string}
                                                  target="_blank"
                                                  className="flex items-center gap-2 underline decoration-dotted underline-offset-4"
                                               >
                                                  <Download className="h-4 w-4" /> Download File
                                               </a>
                                            )}
                                         </div>
                                      ) : (
                                         msg.content as string
                                      )}
                                   </div>
                                   <div className={cn(
                                      "flex items-center gap-1 mt-1 px-1",
                                      msg.sender_id === adminId ? "justify-end" : "justify-start"
                                   )}>
                                      <span className="text-[9px] text-muted-foreground">
                                         {new Date(msg.created_at as string).toLocaleString()}
                                      </span>
                                      {msg.sender_id === adminId && (
                                         msg.is_read ? (
                                            <CheckCheck className="h-3 w-3 text-sky-400" />
                                         ) : (
                                            <Check className="h-3 w-3 text-slate-400" />
                                         )
                                      )}
                                   </div>
                                </div>
                             ))}
                             {selectedChatStudent && typingStudents[selectedChatStudent] && (
                                <div className="flex flex-col max-w-[70%] items-start animate-pulse">
                                   <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl rounded-tl-none border text-[10px] font-bold italic">
                                      Student is typing...
                                   </div>
                                </div>
                             )}
                             </>
                          )}
                       </div>
                       <div className="p-4 border-t bg-slate-50/30 dark:bg-slate-800/10">
                          <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex gap-2 items-center">
                             <input
                                type="file"
                                className="hidden"
                                ref={chatFileRef}
                                onChange={handleChatFileUpload}
                             />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary"
                                disabled={isChatUploading}
                                onClick={() => chatFileRef.current?.click()}
                             >
                                {isChatUploading ? <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Paperclip className="h-5 w-5" />}
                             </Button>
                             <Input
                                placeholder="Type your response..."
                                className="h-12 text-sm focus-visible:ring-primary"
                                value={newChatInput}
                                onChange={(e) => handleTyping(e.target.value)}
                                disabled={isChatUploading}
                             />
                             <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isChatUploading}>
                                <SendHorizontal className="h-5 w-5" />
                             </Button>
                          </form>
                       </div>
                    </>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-12 text-center">
                       <MessageCircle className="h-20 w-20 mb-6" />
                       <h2 className="text-2xl font-black uppercase tracking-tighter">Support Command Center</h2>
                       <p className="max-w-md mt-2 text-sm">Select a student from the sidebar to start a real-time 1-on-1 conversation or manage their video call requests.</p>
                    </div>
                 )}
              </div>
           </div>
        ) : activeTab === 'courses' ? (
          <div className="space-y-8 md:space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Course Management</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Organize your curriculum into Parent Courses, Sub-Courses, and Standalone programs.</p>
              </div>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditingCourse({ index: courses.length + 1, name: '', slug: '' })}>
                <Plus className="h-4 w-4 mr-2" /> Create New
              </Button>
            </div>

            {/* Parent Courses */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                <Layers className="h-5 w-5" /> Parent Courses
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {courses.filter(c => !c.parent_id && courses.some(sub => sub.parent_id === c.id)).map(parent => (
                  <Card key={parent.id} className="overflow-hidden border-2">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Layout className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black">{parent.name}</h4>
                          <p className="text-sm text-muted-foreground">{parent.description || 'Parent container for sub-courses.'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingCourse({ parent_id: parent.id, index: courses.filter(c => c.parent_id === parent.id).length + 1, name: '', slug: '' })}>
                          <Plus className="h-4 w-4 mr-2" /> Add Sub-Course
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingCourse(parent)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCourse(parent.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.filter(c => c.parent_id === parent.id).map(sub => (
                          <div key={sub.id} className="group relative p-4 rounded-xl border bg-card hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">Sub-Course</Badge>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCourse(sub)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCourse(sub.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            <h5 className="font-bold">{sub.name}</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{sub.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-muted-foreground">{sub.slug}</span>
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest" onClick={() => {
                                setSelectedCourseId(sub.id);
                                setActiveTab('structure');
                              }}>Manage Content <ChevronRight className="h-3 w-3 ml-1" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Standalone Courses */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                <BookOpen className="h-5 w-5" /> Standalone Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(c => !c.parent_id && !courses.some(sub => sub.parent_id === c.id)).map(course => (
                  <Card key={course.id} className="overflow-hidden group flex flex-col">
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
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg">{course.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{course.description || 'No description provided.'}</p>
                      <div className="flex justify-between items-center mt-4">
                         <Badge variant="outline" className="text-[10px]">{course.slug}</Badge>
                         <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest" onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('structure');
                          }}>Manage <ChevronRight className="h-3 w-3 ml-1" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <button
                  onClick={() => setEditingCourse({ index: courses.length + 1, name: '', slug: '' })}
                  className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all space-y-2"
                >
                  <Plus className="h-8 w-8" />
                  <span className="font-bold uppercase tracking-tighter text-sm">Create New Program</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'students' ? (
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 shrink-0"><Users className="h-5 w-5" /> All Profiles</h2>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search students..." className="pl-9" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {students.map((student: StudentProfile) => (
                  <Card key={student.id}>
                    <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">{student.full_name[0]}</div>
                        <div><p className="font-bold text-sm md:text-base">{student.full_name}</p><p className="text-[10px] md:text-xs text-slate-500">Joined {new Date(student.enrollment_date).toLocaleDateString()}</p></div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                        <div className="text-center"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Submissions</p><p className="font-bold text-sm">{student.submissions?.length || 0}</p></div>
                        <Badge variant={student.is_pro ? "default" : "secondary"} className="text-[10px]">{student.is_pro ? 'PRO' : 'BASIC'}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => setViewingStudent(student)}><FileText className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
        ) : activeTab === 'structure' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Structure</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Modules & Sub-Modules.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border w-full sm:w-auto">
                   <Label className="pl-3 text-[10px] font-bold uppercase text-slate-500">Course:</Label>
                   <select
                     className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                     value={selectedCourseId}
                     onChange={(e) => setSelectedCourseId(e.target.value)}
                   >
                     {parentCourses.map(parent => {
                       const hasChildren = courses.some(c => c.parent_id === parent.id);
                       return (
                        <optgroup key={parent.id} label={parent.name}>
                          {/* If it's a parent course container, mark it clearly */}
                          <option value={parent.id}>{parent.name} {hasChildren ? '(Parent Container)' : '(Standalone)'}</option>
                          {courses.filter(c => c.parent_id === parent.id).map(sub => (
                            <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                          ))}
                        </optgroup>
                       );
                     })}
                     {courses.filter(c => !c.parent_id && !parentCourses.find(pc => pc.id === c.id)).map(standalone => (
                       <option key={standalone.id} value={standalone.id}>{standalone.name}</option>
                     ))}
                   </select>
                </div>
              </div>
              {/* Only show Add Module if the selected course is a Sub-Course or Standalone (not a Parent with children) */}
              {(!courses.some(c => c.parent_id === selectedCourseId)) && (
                <Button onClick={() => setEditingModule({ course_id: selectedCourseId, index: modules.filter(m => m.course_id === selectedCourseId).length + 1, name: '' })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Module
                </Button>
              )}
            </div>

            {/* If a Parent Course is selected, show its sub-courses instead of modules */}
            {courses.some(c => c.parent_id === selectedCourseId) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {courses.filter(c => c.parent_id === selectedCourseId).map(sub => (
                  <Card key={sub.id} className="group hover:border-primary transition-all cursor-pointer" onClick={() => setSelectedCourseId(sub.id)}>
                    <CardHeader>
                      <Badge variant="outline" className="w-fit mb-2">Sub-Course</Badge>
                      <CardTitle className="flex justify-between items-center">
                        {sub.name}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-2">{modules.filter(m => m.course_id === sub.id).length} Modules defined.</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
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
                <div className="p-6 md:p-12 text-center border-2 border-dashed rounded-xl">
                  <Layout className="h-10 w-10 md:h-12 md:w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-sm md:text-base text-slate-500">No modules created yet. Start by adding your first module.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setEditingModule({ index: 1, name: '' })}>Add First Module</Button>
                </div>
              )}
            </div>
            )}
          </div>
        ) : activeTab === 'curriculum' ? (
          <div className="space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                <div><h2 className="text-xl md:text-2xl font-bold">Content</h2><p className="text-xs md:text-sm text-muted-foreground">Lectures & Tasks.</p></div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border w-full sm:w-auto">
                   <Label className="pl-3 text-[10px] font-bold uppercase text-slate-500">Course:</Label>
                   <select
                     className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                     value={selectedCourseId}
                     onChange={(e) => setSelectedCourseId(e.target.value)}
                   >
                     {parentCourses.map(parent => {
                        const hasChildren = courses.some(c => c.parent_id === parent.id);
                        return (
                          <optgroup key={parent.id} label={parent.name}>
                            <option value={parent.id}>{parent.name} {hasChildren ? '(Parent Container)' : '(Standalone)'}</option>
                            {courses.filter(c => c.parent_id === parent.id).map(sub => (
                              <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                            ))}
                          </optgroup>
                        );
                     })}
                     {courses.filter(c => !c.parent_id && !parentCourses.find(pc => pc.id === c.id)).map(standalone => (
                       <option key={standalone.id} value={standalone.id}>{standalone.name}</option>
                     ))}
                   </select>
                </div>
              </div>
              {(!courses.some(c => c.parent_id === selectedCourseId)) && (
                <Button onClick={() => {
                const courseModules = modules.filter(m => m.course_id === selectedCourseId).sort((a,b) => a.index - b.index);
                const lastMod = courseModules[courseModules.length - 1];
                const lastSub = subModules.filter(s => s.module_id === lastMod?.id).pop();
                setEditingItem({
                  id: `new-${Date.now()}`,
                  course_id: selectedCourseId,
                  module_id: lastMod?.id,
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
              )}
            </div>
            {courses.some(c => c.parent_id === selectedCourseId) ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {courses.filter(c => c.parent_id === selectedCourseId).map(sub => (
                    <Card key={sub.id} className="group hover:border-primary transition-all cursor-pointer" onClick={() => setSelectedCourseId(sub.id)}>
                      <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2">Sub-Course</Badge>
                        <CardTitle className="flex justify-between items-center">
                          {sub.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-2">{curriculum.filter(i => i.course_id === sub.id).length} Lectures & Tasks.</p>
                      </CardHeader>
                    </Card>
                  ))}
               </div>
            ) : modules.filter(m => m.course_id === selectedCourseId).length > 0 ? modules.filter(m => m.course_id === selectedCourseId).map(mod => {
              const moduleSubModules = subModules.filter(s => s.module_id === mod.id);
              const moduleLectures = curriculum.filter(i => i.module_id === mod.id || (!i.module_id && i.week === mod.index && (i.course_id === selectedCourseId || !i.course_id)));

              return (
                <div key={mod.id} className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">M{mod.index}</div>
                        <h3 className="text-xl font-bold">{mod.name}</h3>
                        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setEditingItem({
                          id: `new-${Date.now()}`,
                          course_id: selectedCourseId,
                          module_id: mod.id,
                          week: mod.index,
                          module_name: mod.name,
                          day: `Lecture ${moduleLectures.length + 1}`,
                          type: 'lecture',
                          title: '',
                          description: '',
                          lecture_index: (moduleLectures[moduleLectures.length - 1]?.lecture_index || 0) + 1
                       })}
                     >
                       <Plus className="h-3 w-3 mr-1" /> Add Lecture
                     </Button>
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
                                course_id: selectedCourseId,
                                module_id: mod.id,
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
                           {moduleLectures.filter(l => !l.sub_module_id).sort((a,b) => (a.lecture_index || 0) - (b.lecture_index || 0)).map((item) => (
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
                    )}
                  </div>
                </div>
              );
            }) : !courses.some(c => c.parent_id === selectedCourseId) && (
              <div className="p-12 text-center border-2 border-dashed rounded-xl">
                 <Layout className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                 <p className="text-slate-500">Create some Modules first in the &quot;Course Structure&quot; tab.</p>
                 <Button variant="outline" className="mt-4" onClick={() => setActiveTab('structure')}>Go to Course Structure</Button>
              </div>
            )}
          </div>
        ) : activeTab === 'attendance' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5" /> Attendance Log</h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id as string}>
                        <TableCell className="font-medium">{(record.profiles as Record<string, unknown>)?.full_name as string}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(record.date as string).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right"><Badge className="bg-green-600 text-[10px]">PRESENT</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        ) : activeTab === 'library' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Library className="h-5 w-5" /> Library</h2>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditingResource({ title: '', type: 'book', price_points: 0, is_published: true })}>
                <Plus className="h-4 w-4 mr-2" /> Add Resource
              </Button>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {resources.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-bold">{res.title}</TableCell>
                      <TableCell><Badge variant="secondary">{res.type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>{res.price_points} pts</TableCell>
                      <TableCell>
                        <Badge variant={res.is_published ? "default" : "outline"} className={res.is_published ? "bg-emerald-600" : ""}>
                          {res.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingResource(res)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteResource(res.id!)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        ) : activeTab === 'challenges' ? (
           <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Trophy className="h-5 w-5" /> Daily Challenges</h2>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditingChallenge({ title: '', difficulty: 'easy', points_reward: 50, active_date: new Date().toISOString().split('T')[0] })}>
                <Plus className="h-4 w-4 mr-2" /> Add Challenge
              </Button>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Difficulty</TableHead><TableHead>Reward</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                  {challenges.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell>{ch.active_date}</TableCell>
                      <TableCell className="font-bold">{ch.title}</TableCell>
                      <TableCell><Badge variant={ch.difficulty === 'hard' ? 'destructive' : ch.difficulty === 'medium' ? 'default' : 'secondary'}>{ch.difficulty}</Badge></TableCell>
                      <TableCell>{ch.points_reward} pts</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingChallenge(ch)}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
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

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="bg-blue-500 text-white border-none shadow-xl">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] md:text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Active Students
                      </CardTitle>
                      <div className="text-2xl md:text-3xl font-black">{students.length}</div>
                   </CardHeader>
                   <CardContent className="text-[10px] md:text-xs opacity-90">Total enrolled across all courses.</CardContent>
                </Card>
                <Card className="bg-emerald-500 text-white border-none shadow-xl">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] md:text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Check className="h-4 w-4" /> Avg Completion
                      </CardTitle>
                      <div className="text-2xl md:text-3xl font-black">
                         {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.submissions?.length || 0), 0) / (students.length * curriculum.length || 1) * 100) : 0}%
                      </div>
                   </CardHeader>
                   <CardContent className="text-[10px] md:text-xs opacity-90">Average progress per student.</CardContent>
                </Card>
                <Card className="bg-purple-600 text-white border-none shadow-xl sm:col-span-2 md:col-span-1">
                   <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] md:text-xs uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Total Submissions
                      </CardTitle>
                      <div className="text-2xl md:text-3xl font-black">{students.reduce((acc, s) => acc + (s.submissions?.length || 0), 0)}</div>
                   </CardHeader>
                   <CardContent className="text-[10px] md:text-xs opacity-90">Total assignments & quizzes turned in.</CardContent>
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
          <DialogContent className="max-w-5xl w-[95vw] md:w-full max-h-[85vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pr-8">
                  <DialogTitle>Student Profile: {viewingStudent?.full_name}</DialogTitle>
                  <div className="flex gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto">
                     <Button
                        variant={studentTab === 'submissions' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="flex-1 sm:flex-none text-[10px] md:text-xs font-bold"
                        onClick={() => setStudentTab('submissions')}
                     >Submissions</Button>
                     <Button
                        variant={studentTab === 'activity' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="flex-1 sm:flex-none text-[10px] md:text-xs font-bold"
                        onClick={() => setStudentTab('activity')}
                     >Activity Log</Button>
                  </div>
               </div>
            </DialogHeader>

            <div className="py-4">
              {studentTab === 'submissions' ? (
                <div className="space-y-8">
                  <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tighter"><Send className="h-5 w-5" /> Completed Curriculum</h3>

                  {courses.map(course => {
                    const courseLectures = curriculum.filter(l => l.course_id === course.id);
                    const completedLectures = viewingStudent?.submissions?.filter(s => courseLectures.some(l => l.id === s.curriculum_id)) || [];

                    if (completedLectures.length === 0) return null;

                    return (
                      <div key={course.id} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-black uppercase tracking-widest text-[10px]">{course.name}</Badge>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        </div>

                        {modules.filter(m => m.course_id === course.id).map(mod => {
                          const moduleLectures = courseLectures.filter(l => l.module_id === mod.id);
                          const moduleCompletions = completedLectures.filter(s => moduleLectures.some(l => l.id === s.curriculum_id));

                          if (moduleCompletions.length === 0) return null;

                          return (
                            <div key={mod.id} className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Module {mod.index}: {mod.name}
                              </h4>

                              <div className="grid grid-cols-1 gap-3">
                                {moduleCompletions.sort((a,b) => {
                                  const la = curriculum.find(l => l.id === a.curriculum_id)?.lecture_index || 0;
                                  const lb = curriculum.find(l => l.id === b.curriculum_id)?.lecture_index || 0;
                                  return la - lb;
                                }).map((sub: StudentSubmission) => {
                                  const lecture = curriculum.find(l => l.id === sub.curriculum_id);
                                  const isExpanded = expandedSubId === sub.id;

                                  return (
                                    <Card key={sub.id} className={cn("overflow-hidden transition-all duration-300", isExpanded ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950" : "hover:border-primary/50")}>
                                      <button
                                        onClick={() => {
                                          if (isExpanded) {
                                            setExpandedSubId(null);
                                          } else {
                                            setExpandedSubId(sub.id);
                                            if (sub.github_url) fetchGitHubCode(sub.github_url);
                                          }
                                        }}
                                        className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between group"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors", sub.status === 'reviewed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                            #{lecture?.lecture_index || '?'}
                                          </div>
                                          <div>
                                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{lecture?.title || 'Unknown Lecture'}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{new Date(sub.submitted_at).toLocaleString()}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="text-right hidden sm:block">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Status</div>
                                            <Badge variant={sub.status === 'reviewed' ? 'default' : 'secondary'} className={cn("text-[9px] h-5", sub.status === 'reviewed' && "bg-emerald-600")}>
                                              {sub.status.toUpperCase()}
                                            </Badge>
                                          </div>
                                          <div className="text-right hidden sm:block">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Score</div>
                                            <div className="text-sm font-black">{sub.ai_score ?? '--'}/100</div>
                                          </div>
                                          {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary" />}
                                        </div>
                                      </button>

                                      {isExpanded && (
                                        <CardContent className="p-6 space-y-10 border-t bg-white dark:bg-slate-950 animate-in slide-in-from-top-2 duration-300">
                                          {/* Lecture Reading & Sectional Score Calculation */}
                                          {(() => {
                                             const hasKC = !!(lecture?.knowledge_checks && lecture.knowledge_checks.length > 0);
                                             const hasAss = !!lecture?.attached_assignment;
                                             const hasQuiz = !!lecture?.attached_quiz;

                                             let theoryWeight = 50;
                                             let kcWeight = hasKC ? 15 : 0;
                                             let assWeight = hasAss ? 15 : 0;
                                             let quizWeight = hasQuiz ? 20 : 0;

                                             // Adjust weights if technical parts are missing
                                             const technicalWeightSum = kcWeight + assWeight + quizWeight;
                                             if (technicalWeightSum === 0) {
                                                theoryWeight = 100;
                                             } else if (technicalWeightSum < 50) {
                                                // Scale remaining technical parts to fill 50 points
                                                const scale = 50 / technicalWeightSum;
                                                kcWeight *= scale;
                                                assWeight *= scale;
                                                quizWeight *= scale;
                                             }

                                             const theoryPoints = sub.completion_data?.theory_read ? theoryWeight : 0;
                                             const kcPoints = hasKC ? ((manualScores[`${sub.id}-kc`] ?? (sub.ai_sections?.knowledge_check?.score || 0)) / 100 * kcWeight) : 0;
                                             const assPoints = hasAss ? ((manualScores[`${sub.id}-ass`] ?? (sub.ai_sections?.assignment?.score || 0)) / 100 * assWeight) : 0;
                                             const quizPoints = hasQuiz ? ((manualScores[`${sub.id}-quiz`] ?? (sub.ai_sections?.quiz?.score || 0)) / 100 * quizWeight) : 0;

                                             return (
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                                   <div className="text-center md:border-r border-primary/10">
                                                      <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Theory Read</p>
                                                      <div className="flex items-center justify-center gap-1">
                                                         {sub.completion_data?.theory_read ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />}
                                                         <span className="text-lg font-black">{Math.round(theoryPoints)}/{Math.round(theoryWeight)}</span>
                                                      </div>
                                                   </div>
                                                   {hasKC && (
                                                      <div className="text-center md:border-r border-primary/10">
                                                         <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Knowledge Check</p>
                                                         <div className="text-lg font-black">{Math.round(kcPoints)}/{Math.round(kcWeight)}</div>
                                                      </div>
                                                   )}
                                                   {hasAss && (
                                                      <div className="text-center md:border-r border-primary/10">
                                                         <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Assignment</p>
                                                         <div className="text-lg font-black">{Math.round(assPoints)}/{Math.round(assWeight)}</div>
                                                      </div>
                                                   )}
                                                   {hasQuiz && (
                                                      <div className="text-center">
                                                         <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Quiz Score</p>
                                                         <div className="text-lg font-black">{Math.round(quizPoints)}/{Math.round(quizWeight)}</div>
                                                      </div>
                                                   )}
                                                </div>
                                             );
                                          })()}

                                          {/* Knowledge Check Details */}
                                          {sub.completion_data?.knowledge_check_answers && (
                                            <div className="space-y-4">
                                              <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <CheckCheck className="h-4 w-4" /> Knowledge Check Answers
                                              </h5>
                                              <div className="space-y-4">
                                                {Object.entries(sub.completion_data.knowledge_check_answers).map(([qId, answer]) => {
                                                  const question = lecture?.knowledge_checks?.find(k => k.id === qId)?.question;
                                                  return (
                                                    <div key={qId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border">
                                                      <div className="text-xs font-bold text-slate-500 mb-2">Q: <span className="text-slate-700 dark:text-slate-300 italic" dangerouslySetInnerHTML={{ __html: question || 'Unknown Question' }} /></div>
                                                      <div className="prose prose-slate prose-sm dark:prose-invert max-w-none bg-white dark:bg-black p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <div dangerouslySetInnerHTML={{ __html: answer }} />
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Quiz Results */}
                                          {lecture?.attached_quiz && sub.completion_data?.quiz_answers && (
                                            <div className="space-y-4">
                                              <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4" /> Quiz Performance
                                              </h5>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {lecture.attached_quiz.map((q, idx) => {
                                                  const studentAnswerIdx = sub.completion_data?.quiz_answers?.[idx];
                                                  const isCorrect = studentAnswerIdx === q.correctAnswer;
                                                  return (
                                                    <div key={idx} className={cn("p-4 rounded-2xl border flex items-start gap-3", isCorrect ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30" : "bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/30")}>
                                                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5", isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                                                        {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                      </div>
                                                      <div>
                                                        <p className="text-xs font-bold mb-1">{q.question}</p>
                                                        <p className="text-[10px] text-muted-foreground">Student: <span className={isCorrect ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>{q.options[studentAnswerIdx ?? -1] || 'No Answer'}</span></p>
                                                        {!isCorrect && <p className="text-[10px] text-emerald-600 font-bold">Correct: {q.options[q.correctAnswer]}</p>}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Code Review / GitHub Section */}
                                          {sub.github_url && (
                                            <div className="space-y-4">
                                              <div className="flex justify-between items-center">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                  <GithubIcon className="h-4 w-4" /> Project Code Review
                                                </h5>
                                                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" asChild>
                                                  <a href={sub.github_url} target="_blank">View Repository <ExternalLink className="h-3 w-3 ml-1" /></a>
                                                </Button>
                                              </div>

                                              {isFetchingCode ? (
                                                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-muted-foreground animate-pulse">
                                                  <Bot className="h-8 w-8 mb-2 animate-bounce" />
                                                  <span className="text-xs font-bold">Fetching source code from GitHub...</span>
                                                </div>
                                              ) : fetchedCode ? (
                                                <div className="space-y-4">
                                                   <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                                      {Object.keys(fetchedCode).map(filename => (
                                                        <Badge
                                                          key={filename}
                                                          variant={selectedFile === filename ? "default" : "outline"}
                                                          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                                                          onClick={() => setSelectedFile(filename)}
                                                        >
                                                          {filename}
                                                        </Badge>
                                                      ))}
                                                   </div>
                                                   <div className="max-h-[500px] overflow-y-auto rounded-xl border bg-slate-900 p-4">
                                                      <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
                                                        {fetchedCode[selectedFile || ''] || 'No code preview available.'}
                                                      </pre>
                                                   </div>
                                                </div>
                                              ) : (
                                                <div className="h-20 flex items-center justify-center border-2 border-dashed rounded-2xl text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                                                  Repository content not available for preview.
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Technical Grading UI */}
                                          <div className="space-y-6 border-t pt-8">
                                             <div className="flex items-center justify-between mb-4">
                                                <h5 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                                                  <TrendingUp className="h-5 w-5" /> Detailed Grading & Feedback
                                                </h5>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                                                  onClick={async () => {
                                                    const lecture = curriculum.find(c => c.id === sub.curriculum_id);
                                                    if (!lecture) return;

                                                    setIsSaving(true);
                                                    try {
                                                      const knowledgeChecks = lecture.knowledge_checks?.map(check => ({
                                                        question: check.question,
                                                        answer: sub.completion_data?.knowledge_check_answers?.[check.id] || ''
                                                      })) || [];

                                                      const response = await fetch('/api/review', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                          githubUrl: sub.github_url,
                                                          assignmentTitle: lecture.attached_assignment?.title || lecture.title,
                                                          assignmentDescription: lecture.attached_assignment?.description || lecture.description,
                                                          knowledgeChecks,
                                                          lectureTitle: lecture.title
                                                        })
                                                      });

                                                      if (response.ok) {
                                                        const review = await response.json();
                                                        setAiReviewData(prev => ({ ...prev, [sub.id]: review }));
                                                        setManualFeedback(prev => ({
                                                           ...prev,
                                                           [sub.id]: review.feedback,
                                                           [`${sub.id}-mistakes`]: review.mistakes?.join('\n') || '',
                                                           [`${sub.id}-improvements`]: review.improvements?.join('\n') || ''
                                                        }));
                                                        setManualScores(prev => ({
                                                           ...prev,
                                                           [sub.id]: review.score,
                                                           [`${sub.id}-kc`]: review.sections?.knowledge_check?.score || 0,
                                                           [`${sub.id}-ass`]: review.sections?.assignment?.score || 0,
                                                           [`${sub.id}-quiz`]: review.sections?.quiz?.score || 0
                                                        }));
                                                        setManualStatus(prev => ({ ...prev, [sub.id]: review.status === 'passed' ? 'reviewed' : 'extra_task_assigned' }));
                                                        success('AI Analysis complete! Values pre-filled.');
                                                      }
                                                    } catch (err) {
                                                      toastError("Failed to trigger AI review.");
                                                    } finally {
                                                      setIsSaving(false);
                                                    }
                                                }}>
                                                  <Bot className="h-3 w-3 mr-2" /> Quick AI Pre-fill
                                                </Button>
                                             </div>

                                             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="space-y-4">
                                                  <div className="space-y-1">
                                                     <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Section Scores (0-100)</Label>
                                                     <div className="space-y-3 pt-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                          <span className="text-[10px] font-bold">Know. Check:</span>
                                                          <Input
                                                            type="number"
                                                            className="w-16 h-8 text-xs font-black text-right"
                                                            value={manualScores[`${sub.id}-kc`] ?? (sub.ai_sections?.knowledge_check?.score || 0)}
                                                            onChange={(e) => setManualScores(prev => ({ ...prev, [`${sub.id}-kc`]: parseInt(e.target.value) }))}
                                                          />
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                          <span className="text-[10px] font-bold">Assignment:</span>
                                                          <Input
                                                            type="number"
                                                            className="w-16 h-8 text-xs font-black text-right"
                                                            value={manualScores[`${sub.id}-ass`] ?? (sub.ai_sections?.assignment?.score || 0)}
                                                            onChange={(e) => setManualScores(prev => ({ ...prev, [`${sub.id}-ass`]: parseInt(e.target.value) }))}
                                                          />
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                          <span className="text-[10px] font-bold">Quiz:</span>
                                                          <Input
                                                            type="number"
                                                            className="w-16 h-8 text-xs font-black text-right"
                                                            value={manualScores[`${sub.id}-quiz`] ?? (sub.ai_sections?.quiz?.score || 0)}
                                                            onChange={(e) => setManualScores(prev => ({ ...prev, [`${sub.id}-quiz`]: parseInt(e.target.value) }))}
                                                          />
                                                        </div>
                                                     </div>
                                                  </div>

                                                  <div className="pt-2">
                                                     <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Calculated Total</Label>
                                                     <div className="flex items-baseline gap-1 mt-1">
                                                        <span className="text-3xl font-black text-primary">
                                                          {(() => {
                                                            const hasKC = !!(lecture?.knowledge_checks && lecture.knowledge_checks.length > 0);
                                                            const hasAss = !!lecture?.attached_assignment;
                                                            const hasQuiz = !!lecture?.attached_quiz;

                                                            let theoryWeight = 50;
                                                            let kcWeight = hasKC ? 15 : 0;
                                                            let assWeight = hasAss ? 15 : 0;
                                                            let quizWeight = hasQuiz ? 20 : 0;

                                                            const technicalWeightSum = kcWeight + assWeight + quizWeight;
                                                            if (technicalWeightSum === 0) {
                                                               theoryWeight = 100;
                                                            } else if (technicalWeightSum < 50) {
                                                               const scale = 50 / technicalWeightSum;
                                                               kcWeight *= scale;
                                                               assWeight *= scale;
                                                               quizWeight *= scale;
                                                            }

                                                            const kc = (manualScores[`${sub.id}-kc`] ?? (sub.ai_sections?.knowledge_check?.score || 0)) / 100 * kcWeight;
                                                            const ass = (manualScores[`${sub.id}-ass`] ?? (sub.ai_sections?.assignment?.score || 0)) / 100 * assWeight;
                                                            const quiz = (manualScores[`${sub.id}-quiz`] ?? (sub.ai_sections?.quiz?.score || 0)) / 100 * quizWeight;
                                                            const theory = sub.completion_data?.theory_read ? theoryWeight : 0;

                                                            return Math.round(theory + kc + ass + quiz);
                                                          })()}
                                                        </span>
                                                        <span className="text-xs font-bold text-muted-foreground">/ 100</span>
                                                     </div>
                                                  </div>
                                                </div>

                                                <div className="md:col-span-3 space-y-4">
                                                   <div className="space-y-2">
                                                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mistakes Identifed</Label>
                                                      <Textarea
                                                        className="min-h-[80px] text-xs font-medium"
                                                        placeholder="One mistake per line..."
                                                        value={manualFeedback[`${sub.id}-mistakes`] ?? (sub.ai_mistakes?.join('\n') || '')}
                                                        onChange={(e) => setManualFeedback(prev => ({ ...prev, [`${sub.id}-mistakes`]: e.target.value }))}
                                                      />
                                                   </div>
                                                   <div className="space-y-2">
                                                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Suggested Improvements</Label>
                                                      <Textarea
                                                        className="min-h-[80px] text-xs font-medium"
                                                        placeholder="One improvement per line..."
                                                        value={manualFeedback[`${sub.id}-improvements`] ?? (sub.ai_improvements?.join('\n') || '')}
                                                        onChange={(e) => setManualFeedback(prev => ({ ...prev, [`${sub.id}-improvements`]: e.target.value }))}
                                                      />
                                                   </div>
                                                   <div className="space-y-2">
                                                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">General Technical Summary</Label>
                                                      <Textarea
                                                        className="min-h-[80px] text-xs font-medium"
                                                        placeholder="Synthesize the student's progress..."
                                                        value={manualFeedback[sub.id] ?? (sub.ai_feedback || '')}
                                                        onChange={(e) => setManualFeedback(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                                      />
                                                   </div>
                                                </div>
                                             </div>

                                             <div className="flex justify-between items-center border-t pt-6">
                                                <div className="flex items-center gap-4">
                                                   <div className="space-y-1">
                                                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Verdict</Label>
                                                      <select
                                                        className="w-48 p-2 rounded-lg border bg-background text-xs font-black uppercase tracking-widest"
                                                        value={manualStatus[sub.id] ?? sub.status}
                                                        onChange={(e) => setManualStatus(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                                      >
                                                         <option value="submitted">⏳ Pending Review</option>
                                                         <option value="reviewed">✅ Pass (Award Sparks)</option>
                                                         <option value="extra_task_assigned">❌ Re-submit (No Points)</option>
                                                      </select>
                                                   </div>
                                                </div>
                                                <Button
                                                  disabled={isSaving}
                                                  className="h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                                  onClick={async () => {
                                                     setIsSaving(true);
                                                      const hasKC = !!(lecture?.knowledge_checks && lecture.knowledge_checks.length > 0);
                                                      const hasAss = !!lecture?.attached_assignment;
                                                      const hasQuiz = !!lecture?.attached_quiz;

                                                      let theoryWeight = 50;
                                                      let kcWeight = hasKC ? 15 : 0;
                                                      let assWeight = hasAss ? 15 : 0;
                                                      let quizWeight = hasQuiz ? 20 : 0;

                                                      const technicalWeightSum = kcWeight + assWeight + quizWeight;
                                                      if (technicalWeightSum === 0) {
                                                         theoryWeight = 100;
                                                      } else if (technicalWeightSum < 50) {
                                                         const scale = 50 / technicalWeightSum;
                                                         kcWeight *= scale;
                                                         assWeight *= scale;
                                                         quizWeight *= scale;
                                                      }

                                                     const kc = manualScores[`${sub.id}-kc`] ?? (sub.ai_sections?.knowledge_check?.score || 0);
                                                     const ass = manualScores[`${sub.id}-ass`] ?? (sub.ai_sections?.assignment?.score || 0);
                                                     const quiz = manualScores[`${sub.id}-quiz`] ?? (sub.ai_sections?.quiz?.score || 0);
                                                      const theoryPercent = sub.completion_data?.theory_read ? 100 : 0;

                                                      const finalScore = Math.round(
                                                         (theoryPercent / 100 * theoryWeight) +
                                                         (kc / 100 * kcWeight) +
                                                         (ass / 100 * assWeight) +
                                                         (quiz / 100 * quizWeight)
                                                      );

                                                     const feedback = manualFeedback[sub.id] ?? (sub.ai_feedback || '');
                                                     const status = manualStatus[sub.id] ?? sub.status;

                                                     const mistakes = (manualFeedback[`${sub.id}-mistakes`] ?? (sub.ai_mistakes?.join('\n') || '')).split('\n').filter(Boolean);
                                                     const improvements = (manualFeedback[`${sub.id}-improvements`] ?? (sub.ai_improvements?.join('\n') || '')).split('\n').filter(Boolean);

                                                     const sections = {
                                                        theory: { score: theoryPercent, feedback: "Reading requirement met." },
                                                        knowledge_check: { score: kc, feedback: sub.ai_sections?.knowledge_check?.feedback || "Manual review" },
                                                        assignment: { score: ass, feedback: sub.ai_sections?.assignment?.feedback || "Manual review" },
                                                        quiz: { score: quiz, feedback: "Quiz auto-score" }
                                                     };

                                                     const res = await reviewSubmissionAction(
                                                        sub.id,
                                                        feedback,
                                                        finalScore,
                                                        status === 'extra_task_assigned' ? 'failed' : 'passed',
                                                        sections,
                                                        mistakes,
                                                        improvements
                                                     );

                                                     if (res.success) {
                                                        success('Submission graded and student rewarded!');
                                                        fetchAdminData();
                                                     } else {
                                                        toastError('Failed to save grade.');
                                                     }
                                                     setIsSaving(false);
                                                  }}
                                                >
                                                  {isSaving ? 'Processing...' : 'Complete Review & Award Sparks'}
                                                </Button>
                                             </div>
                                          </div>
                                        </CardContent>
                                      )}
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tighter"><MousePointer2 className="h-5 w-5" /> Activity Timeline</h3>
                       <Badge variant="outline">{viewingStudent?.student_activity?.length || 0} Events Logged</Badge>
                    </div>

                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 space-y-8">
                       {viewingStudent?.student_activity?.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()).map((act: Record<string, unknown>) => (
                         <div key={act.id as string} className="relative">
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
                                     <span className="text-xs font-black uppercase tracking-widest text-primary">{(act.activity_type as string).replace('_', ' ')}</span>
                                     <h4 className="font-bold text-sm">{act.page_url as string || '/'}</h4>
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">{new Date(act.created_at as string).toLocaleString()}</span>
                               </div>
                               {(act.details as Record<string, unknown>) && Object.keys(act.details as Record<string, unknown>).length > 0 && (
                                  <div className="text-[10px] bg-white dark:bg-black p-2 rounded border font-mono opacity-80">
                                     {JSON.stringify(act.details as Record<string, unknown>)}
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
          <DialogContent className="max-w-4xl w-[95vw] md:w-full overflow-y-auto max-h-[90vh] p-4 md:p-6">
            <DialogHeader><DialogTitle>{editingItem?.id?.startsWith('new-') ? 'Add' : 'Edit'} Curriculum Item</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-8 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Module</Label>
                    <select
                      className="w-full p-2 rounded border bg-background"
                      value={editingItem?.module_id || ''}
                      onChange={(e) => {
                        const mod = modules.find(m => m.id === e.target.value);
                        setEditingItem(prev => ({
                           ...prev!,
                           module_id: e.target.value,
                           week: mod?.index || 1,
                           module_name: mod?.name || '',
                           course_id: mod?.course_id || prev?.course_id,
                           sub_module_id: undefined, // Clear sub-module when module changes
                           sub_module_name: undefined
                        }))
                      }}
                    >
                      <option value="">Select Module</option>
                      {modules.filter(m => m.course_id === editingItem?.course_id).map(m => (
                        <option key={m.id} value={m.id}>M{m.index}: {m.name}</option>
                      ))}
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
                      {subModules.filter(s => s.module_id === editingItem?.module_id).map((s: SubModule) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      {/* Fallback to index-based if module_id not matching above (legacy) */}
                      {subModules.filter(s => s.module_id === modules.find(m => m.index === editingItem?.week && m.course_id === editingItem?.course_id)?.id).map(s => (
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
                  <select className="w-full p-2 rounded border bg-background" value={editingItem?.type || 'lecture'} onChange={(e) => setEditingItem(prev => ({ ...prev!, type: e.target.value as CurriculumItem['type'] }))}>
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
                        else toastError('Upload failed: ' + (typeof res.error === 'string' ? res.error : JSON.stringify(res.error)));
                      } catch { toastError('Upload error'); }
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

                    <div className="space-y-4 border-t pt-6">
                      <div className="flex justify-between items-center">
                         <Label className="text-lg font-bold flex items-center gap-2">
                           <CheckCheck className="h-5 w-5 text-emerald-500" /> Knowledge Checks
                         </Label>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                              const current = editingItem.knowledge_checks || [];
                              setEditingItem(prev => ({
                                 ...prev!,
                                 knowledge_checks: [...current, { id: Math.random().toString(36).substring(7), question: '' }]
                              }));
                           }}
                         >
                           <Plus className="h-4 w-4 mr-1" /> Add Question
                         </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Add questions that students must answer using the rich text editor.</p>

                      <div className="space-y-6">
                         {editingItem.knowledge_checks?.map((check, idx) => (
                           <Card key={check.id} className="p-4 bg-slate-50 dark:bg-slate-900 border-dashed">
                              <div className="flex justify-between items-center mb-2">
                                 <Badge variant="outline">Question #{idx + 1}</Badge>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => {
                                       const filtered = editingItem.knowledge_checks?.filter((_, i) => i !== idx);
                                       setEditingItem(prev => ({ ...prev!, knowledge_checks: filtered }));
                                    }}
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                              <RichTextEditor
                                 content={check.question}
                                 onChange={(content) => {
                                    const updated = [...(editingItem.knowledge_checks || [])];
                                    updated[idx] = { ...updated[idx], question: content };
                                    setEditingItem(prev => ({ ...prev!, knowledge_checks: updated }));
                                 }}
                                 placeholder="Write your question here..."
                              />
                           </Card>
                         ))}
                         {(!editingItem.knowledge_checks || editingItem.knowledge_checks.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground italic">
                               No knowledge checks added yet.
                            </div>
                         )}
                      </div>
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
                        {((Array.isArray(editingItem.content) ? editingItem.content : null) || extractHeadings(editingItem.theory_content)).map((entry: { level: number; text: string; id: string }, idx: number) => (
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
                                const newToc = currentToc.filter((_, i: number) => i !== idx);
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
                         <RichTextEditor
                            key={`assignment-desc-${editingItem.id}`}
                            content={editingItem.attached_assignment?.description || ''}
                            onChange={(content) => setEditingItem(prev => ({
                               ...prev!,
                               attached_assignment: {
                                  ...prev!.attached_assignment!,
                                  description: content,
                                  title: prev!.attached_assignment?.title || '',
                                  requirements: prev!.attached_assignment?.requirements || []
                               }
                            }))}
                         />
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
                        } catch {
                          // Ignore
                        }
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
          <DialogContent className="w-[95vw] md:max-w-lg">
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
          <DialogContent className="w-[95vw] md:max-w-lg">
            <DialogHeader><DialogTitle>{editingSubModule?.id ? 'Edit' : 'Add'} Sub-Module</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Sub-Module Index</Label><Input type="number" value={editingSubModule?.index || 1} onChange={(e) => setEditingSubModule(prev => ({ ...prev!, index: parseInt(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Sub-Module Name</Label><Input value={editingSubModule?.name || ''} onChange={(e) => setEditingSubModule(prev => ({ ...prev!, name: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveSubModule(editingSubModule!)}>Save Sub-Module</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
          <DialogContent className="w-[95vw] md:max-w-lg">
            <DialogHeader><DialogTitle>{editingCourse?.id ? 'Edit' : 'Add'} Course</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Course Name</Label><Input value={editingCourse?.name || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={editingCourse?.slug || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, slug: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Course Hierarchy</Label>
                <select
                  className="w-full p-2 border rounded font-medium"
                  value={editingCourse?.parent_id || ''}
                  onChange={(e) => setEditingCourse(prev => ({ ...prev!, parent_id: e.target.value || undefined }))}
                >
                  <option value="">Standalone / Parent Course Container</option>
                  {courses.filter(c => c.id !== editingCourse?.id && !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>Sub-Course of: {c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Note: A Parent Course container should not have modules/lectures directly. It only groups sub-courses.
                </p>
              </div>
              <div className="space-y-2"><Label>Index</Label><Input type="number" value={editingCourse?.index || 1} onChange={(e) => setEditingCourse(prev => ({ ...prev!, index: parseInt(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingCourse?.description || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Thumbnail URL (Optional)</Label><Input value={editingCourse?.thumbnail_url || ''} onChange={(e) => setEditingCourse(prev => ({ ...prev!, thumbnail_url: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveCourse(editingCourse!)}>Save Course</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
          <DialogContent className="max-w-3xl w-[95vw] md:w-full overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingResource?.id ? 'Edit' : 'Add'} Library Resource</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full p-2 border rounded" value={editingResource?.type} onChange={(e) => setEditingResource(prev => ({ ...prev!, type: e.target.value as Resource['type'] }))}>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={editingResource?.is_published || false}
                  onChange={(e) => setEditingResource(prev => ({ ...prev!, is_published: e.target.checked }))}
                />
                <Label htmlFor="is_published">Published (Visible to Students)</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thumbnail Image</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Image URL..."
                      className="flex-1"
                      value={editingResource?.thumbnail_url || ''}
                      onChange={(e) => setEditingResource(prev => ({ ...prev!, thumbnail_url: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isThumbnailUploading}
                      onClick={() => thumbnailFileRef.current?.click()}
                    >
                      <Plus className={cn("h-4 w-4", isThumbnailUploading && "animate-pulse")} />
                    </Button>
                  </div>
                  <input
                    type="file"
                    ref={thumbnailFileRef}
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsThumbnailUploading(true);
                      const fd = new FormData();
                      fd.append('file', file);
                      try {
                        const res = await uploadImageAction(fd);
                        if (res.success) {
                          success('Thumbnail uploaded!');
                          setEditingResource(prev => ({ ...prev!, thumbnail_url: res.url }));
                        } else toastError('Upload failed: ' + (typeof res.error === 'string' ? res.error : JSON.stringify(res.error)));
                      } catch { toastError('Upload error'); }
                      finally {
                        setIsThumbnailUploading(false);
                        if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
                      }
                    }}
                  />
                </div>
                {editingResource?.thumbnail_url && (
                  <div className="h-20 w-20 rounded-lg overflow-hidden border">
                    <img src={editingResource.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
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
                      else toastError('Upload failed: ' + (typeof res.error === 'string' ? res.error : JSON.stringify(res.error)));
                    } catch { toastError('Upload error'); }
                    finally {
                      setIsResourceUploading(false);
                      if (resourceFileRef.current) resourceFileRef.current.value = '';
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Upload PDF, Image, Word, etc.</p>
              </div>
            </div>
            <DialogFooter><Button onClick={() => handleSaveResource(editingResource!)}>Save Resource</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingChallenge} onOpenChange={(open) => !open && setEditingChallenge(null)}>
          <DialogContent className="max-w-4xl w-[95vw] md:w-full overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingChallenge?.id ? 'Edit' : 'Add'} Daily Challenge</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Active Date</Label><Input type="date" value={editingChallenge?.active_date} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, active_date: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Difficulty</Label>
                  <select className="w-full p-2 border rounded" value={editingChallenge?.difficulty} onChange={(e) => setEditingChallenge(prev => ({ ...prev!, difficulty: e.target.value as DailyChallenge['difficulty'] }))}>
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
                      setEditingChallenge(prev => ({ ...prev!, initial_code: JSON.parse(e.target.value) as Record<string, unknown> }));
                    } catch {
                      // Ignore
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
                      setEditingChallenge(prev => ({ ...prev!, test_cases: JSON.parse(e.target.value) as Record<string, unknown>[] }));
                    } catch {
                      // Ignore
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
