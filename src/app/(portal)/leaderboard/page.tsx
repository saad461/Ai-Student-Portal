'use client';

import { Sidebar } from '@/components/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const leaders = [
    { name: 'Alex River', points: 1250, streak: 15 },
    { name: 'Sam Smith', points: 1100, streak: 12 },
    { name: 'Jordan Lee', points: 950, streak: 8 },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">See how you rank against other students.</p>
          </header>

          <div className="grid grid-cols-1 gap-6">
            {leaders.map((leader, idx) => (
              <Card key={idx} className={idx === 0 ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? "bg-yellow-500 text-white" :
                      idx === 1 ? "bg-slate-300 text-slate-700" :
                      "bg-orange-300 text-orange-800"
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{leader.name}</p>
                      <p className="text-xs text-muted-foreground">{leader.streak} Day Streak 🔥</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{leader.points}</span>
                    <span className="text-sm text-muted-foreground uppercase font-medium">Points</span>
                    {idx === 0 && <Medal className="h-6 w-6 text-yellow-500 ml-2" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
