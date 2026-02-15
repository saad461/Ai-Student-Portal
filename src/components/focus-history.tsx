'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface FocusSession {
  id: string;
  duration_seconds: number;
  completed_at: string;
}

export function FocusHistory() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      setSessions(data as unknown as FocusSession[] || []);
      setLoading(false);
    }

    fetchSessions();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  if (loading) return <div>Loading history...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Recent Focus Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No sessions recorded yet. Start focusing!</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{format(new Date(session.completed_at), 'MMM d, h:mm a')}</span>
                </div>
                <div className="font-mono font-bold text-primary">
                  {formatDuration(session.duration_seconds)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
