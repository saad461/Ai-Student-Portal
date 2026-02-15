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
  AlertTriangle
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
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 text-center">Loading Admin Controls...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500">Manage students and curriculum progression.</p>
          </div>
          <Button variant="outline" onClick={() => { localStorage.removeItem('admin_auth'); router.push('/admin/login'); }}>
            Logout Admin
          </Button>
        </header>

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
      </div>
    </div>
  );
}
