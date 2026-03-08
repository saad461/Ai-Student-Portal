'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PortalNavbar } from '@/components/portal-navbar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AttendanceRecord {
  id: string;
  date: string;
  punched_in_at: string;
}

interface Profile {
  full_name: string;
  current_streak: number;
  total_points: number;
}

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, current_streak, total_points')
      .eq('id', user.id)
      .single();

    setProfile(profileData as Profile);

    // Fetch Attendance
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .order('date', { ascending: false });

    setAttendance((attendanceData as AttendanceRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      <PortalNavbar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold">My Attendance</h1>
            <p className="text-muted-foreground">Track your daily portal activity and streaks.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-orange-500 text-white border-none shadow-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Current Streak</CardTitle>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {profile?.current_streak || 0} Days
                  <Flame className="h-8 w-8 fill-white" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs opacity-90">Keep opening the portal daily to increase your streak!</p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground border-none shadow-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Attendance</CardTitle>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {attendance.length} Sessions
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs opacity-90">Total days you've spent 15+ minutes in the portal.</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-600 text-white border-none shadow-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Attendance Points</CardTitle>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {attendance.length * 10} XP
                  <Zap className="h-8 w-8 fill-white" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs opacity-90">Each daily session awards you 10 XP automatically.</p>
              </CardContent>
            </Card>
          </div>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-400">How it works</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-500">
              Attendance is marked automatically once you spend a total of 15 minutes on the portal each day (Monday-Friday). You don't need to click anything!
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Attendance History
              </CardTitle>
              <CardDescription>A detailed log of your recorded attendance sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Marked</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Points Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                        No attendance records found yet. Stay for 15 minutes today to get your first record!
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(record.punched_in_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">PRESENT</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">+10 XP</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
