'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from 'date-fns';

interface HeatmapProps {
  data: { date: string }[];
}

export function AttendanceHeatmap({ data }: HeatmapProps) {
  const today = startOfToday();
  const daysToShow = 365; // Show one year of activity
  const startDate = subDays(today, daysToShow);

  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today });
  }, [startDate, today]);

  const activityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    data.forEach((item) => {
      const dateStr = format(new Date(item.date), 'yyyy-MM-dd');
      map[dateStr] = true;
    });
    return map;
  }, [data]);

  // Group days by week for horizontal layout
  const weeks = useMemo(() => {
    const w: Date[][] = [];
    let currentWeek: Date[] = [];

    // Alignment: find the first Sunday or Monday of the year
    const firstDay = allDays[0];
    const offset = firstDay.getDay(); // 0 is Sunday

    // Add empty spacers for the first week
    for (let i = 0; i < offset; i++) {
        currentWeek.push(null as any);
    }

    allDays.forEach((day) => {
      if (currentWeek.length === 7) {
        w.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
          currentWeek.push(null as any);
      }
      w.push(currentWeek);
    }

    return w;
  }, [allDays]);

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {week.map((day, dayIdx) => {
              if (!day) return <div key={dayIdx} className="w-3 h-3 bg-transparent" />;

              const dateStr = format(day, 'yyyy-MM-dd');
              const hasActivity = activityMap[dateStr];
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={dayIdx}
                  title={`${format(day, 'MMM d, yyyy')}${hasActivity ? ': Present' : ''}`}
                  className={cn(
                    "w-3 h-3 rounded-[2px] transition-colors",
                    hasActivity
                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                        : "bg-muted/30 hover:bg-muted",
                    isToday && !hasActivity && "border border-primary/50"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
         <div className="flex gap-4">
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
         </div>
         <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="w-2 h-2 bg-muted/30 rounded-[1px]" />
            <div className="w-2 h-2 bg-green-500/40 rounded-[1px]" />
            <div className="w-2 h-2 bg-green-500 rounded-[1px]" />
            <span>More</span>
         </div>
      </div>
    </div>
  );
}
