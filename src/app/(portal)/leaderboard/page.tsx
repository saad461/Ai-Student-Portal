'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Star, Zap, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRank, getLevel } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  total_points: number;
  current_streak: number;
  role: string;
}

export default function LeaderboardPage() {
  const [students, setStudents] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, total_points, current_streak, role')
        .eq('role', 'student')
        .order('total_points', { ascending: false })
        .limit(50);

      setStudents(data as LeaderboardEntry[] || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const topThree = students.slice(0, 3);
  const rest = students.slice(3);

  if (loading) return <div className="p-8 text-center animate-pulse">Consulting the Oracle...</div>;

  return (
    <div className="p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <header className="text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                <Trophy className="h-4 w-4" /> Global Hall of Fame
             </div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Elite Rankings</h1>
             <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
                Celebrating the most consistent and high-performing architects in the ecosystem.
                Where code meets discipline.
             </p>
          </header>

          {/* Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pb-12">
             {/* 2nd Place */}
             {topThree[1] && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="order-2 md:order-1"
               >
                  <PodiumCard entry={topThree[1]} rank={2} color="text-slate-400" />
               </motion.div>
             )}

             {/* 1st Place */}
             {topThree[0] && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="order-1 md:order-2"
               >
                  <PodiumCard entry={topThree[0]} rank={1} color="text-amber-500" isLarge />
               </motion.div>
             )}

             {/* 3rd Place */}
             {topThree[2] && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="order-3"
               >
                  <PodiumCard entry={topThree[2]} rank={3} color="text-orange-600" />
               </motion.div>
             )}
          </div>

          {/* Ranking Table */}
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
             <CardHeader className="p-8 border-b">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                      <Users className="h-6 w-6 text-primary" /> Contenders
                   </CardTitle>
                   <Badge variant="outline" className="font-bold">{students.length} Active Students</Badge>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y">
                   {rest.map((student, index) => (
                     <div
                       key={student.id}
                       className={cn(
                         "p-6 flex items-center gap-6 transition-colors hover:bg-primary/5",
                         student.id === currentUserId && "bg-primary/10"
                       )}
                     >
                        <div className="w-8 text-center font-black text-slate-400">#{index + 4}</div>
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                           <AvatarFallback className="font-black bg-primary/10 text-primary">
                              {student.full_name.split(' ').map(n => n[0]).join('')}
                           </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <h4 className="font-black uppercase tracking-tighter">{student.full_name}</h4>
                              {student.id === currentUserId && <Badge className="text-[10px] h-4">YOU</Badge>}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {getRank(getLevel(student.total_points)).title} • LVL {getLevel(student.total_points)}
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xl font-black text-primary">{student.total_points}</div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">XP TOTAL</div>
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-1">
                           <div className="flex items-center gap-1 text-orange-500 font-black">
                              <Zap className="h-4 w-4 fill-orange-500" /> {student.current_streak}
                           </div>
                           <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">STREAK</div>
                        </div>
                     </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>
    </div>
  );
}

function PodiumCard({ entry, rank, color, isLarge = false }: { entry: LeaderboardEntry, rank: number, color: string, isLarge?: boolean }) {
  const level = getLevel(entry.total_points);
  const rankData = getRank(level);

  return (
    <Card className={cn(
      "relative pt-12 pb-8 px-6 text-center border-none shadow-2xl transition-all hover:scale-[1.05]",
      isLarge ? "bg-slate-900 text-white scale-110 z-10" : "bg-white/80 dark:bg-slate-800/80"
    )}>
       <div className={cn(
         "absolute -top-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-2xl",
         isLarge ? "bg-amber-500 text-white" : "bg-muted text-foreground"
       )}>
          {rank === 1 ? <Trophy className="h-8 w-8" /> : rank === 2 ? <Medal className="h-8 w-8" /> : <Star className="h-8 w-8" />}
       </div>

       <div className="mb-4">
          <div className="relative inline-block">
             <Avatar className={cn("h-24 w-24 border-4", isLarge ? "border-amber-500" : "border-primary/20")}>
                <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                  {entry.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
             </Avatar>
             <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-black border-4 border-background text-sm">
                {level}
             </div>
          </div>
       </div>

       <div className="space-y-1">
          <h3 className="text-xl font-black uppercase tracking-tighter">{entry.full_name}</h3>
          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isLarge ? "text-amber-500" : color)}>
             {rankData.title}
          </p>
       </div>

       <div className="mt-6 pt-6 border-t border-white/10 flex justify-around">
          <div>
             <div className="text-2xl font-black">{entry.total_points}</div>
             <div className="text-[8px] font-bold opacity-50 uppercase tracking-widest">Points</div>
          </div>
          <div>
             <div className="text-2xl font-black text-orange-500 flex items-center gap-1">
                <Zap className="h-5 w-5 fill-orange-500" />
                {entry.current_streak}
             </div>
             <div className="text-[8px] font-bold opacity-50 uppercase tracking-widest">Streak</div>
          </div>
       </div>
    </Card>
  );
}
