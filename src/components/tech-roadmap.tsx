'use client';

import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  LayoutTemplate,
  Globe,
  Database,
  Brain,
  Bot,
  CheckCircle2,
  Circle,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseNode {
  id: string;
  number: string;
  title: string;
  skills: string[];
  icon: LucideIcon;
  description: string;
}

const PHASES: PhaseNode[] = [
  {
    id: 'foundation',
    number: '01',
    title: "The Foundation",
    description: "Establishing the structural core of modern interfaces.",
    skills: ["HTML5", "CSS3", "Tailwind", "JavaScript (ES6+)"],
    icon: LayoutTemplate
  },
  {
    id: 'architecture',
    number: '02',
    title: "Web Architecture",
    description: "Building scalable, high-performance web ecosystems.",
    skills: ["Next.js", "React", "Node.js", "PostgreSQL"],
    icon: Globe
  },
  {
    id: 'data',
    number: '03',
    title: "Data Intelligence",
    description: "Processing raw data into actionable intelligence.",
    skills: ["Python", "Pandas", "NumPy", "SQL", "Visualization"],
    icon: Database
  },
  {
    id: 'cognitive',
    number: '04',
    title: "Cognitive AI",
    description: "Integrating generative brains into applications.",
    skills: ["LLMs", "OpenAI/Gemini APIs", "Vector DBs (Pinecone)", "RAG"],
    icon: Brain
  },
  {
    id: 'agentic',
    number: '05',
    title: "Agentic AI",
    description: "Orchestrating autonomous multi-agent systems.",
    skills: ["LangChain", "CrewAI", "Autonomous Task Automation"],
    icon: Bot
  }
];

export function TechRoadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"]
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-20 min-h-[2000px]">
      {/* Central Trunk - SVG Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" /> {/* Emerald */}
              <stop offset="50%" stopColor="#3B82F6" /> {/* Blue */}
              <stop offset="100%" stopColor="#8B5CF6" /> {/* Purple */}
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Dashed Trunk */}
          <line
            x1="50%" y1="50" x2="50%" y2="98%"
            stroke="#1e293b" strokeWidth="2" strokeDasharray="10 10"
          />

          {/* Animated Solid Glow Trunk */}
          <motion.line
            x1="50%" y1="50" x2="50%" y2="98%"
            stroke="url(#line-gradient)" strokeWidth="4"
            style={{ pathLength }}
            filter="url(#glow)"
          />
        </svg>
      </div>

      {/* Content Nodes */}
      <div className="relative z-10 space-y-[300px]">
        {PHASES.map((phase, index) => (
          <RoadmapNode
            key={phase.id}
            phase={phase}
            index={index}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}

function RoadmapNode({
  phase,
  index,
  scrollYProgress
}: {
  phase: PhaseNode;
  index: number;
  scrollYProgress: any
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { margin: "-200px 0px -200px 0px" });

  // Calculate if this node is "active" based on scroll position
  // 5 nodes, so each has roughly 20% of the scroll space
  const step = 1 / PHASES.length;
  const start = index * step;
  const end = (index + 1) * step;

  const isActive = useTransform(scrollYProgress, (pos: number) => pos >= start && pos < end);
  const isPast = useTransform(scrollYProgress, (pos: number) => pos >= end);

  const [status, setStatus] = useState<'future' | 'active' | 'completed'>('future');

  useEffect(() => {
    const unsubscribeActive = isActive.on("change", (val) => {
      if (val) setStatus('active');
    });
    const unsubscribePast = isPast.on("change", (val) => {
      if (val) {
        setStatus('completed');
      } else {
        const currentPos = scrollYProgress.get();
        if (currentPos < start) setStatus('future');
        else if (currentPos >= start && currentPos < end) setStatus('active');
      }
    });

    // Initial check
    const pos = scrollYProgress.get();
    if (pos >= end) setStatus('completed');
    else if (pos >= start) setStatus('active');
    else setStatus('future');

    return () => {
      unsubscribeActive();
      unsubscribePast();
    };
  }, [isActive, isPast, index, start, end, scrollYProgress]);

  const isLeft = index % 2 === 0;

  return (
    <div ref={nodeRef} className="relative flex items-center justify-center w-full min-h-[200px]">
      {/* Branch Line (Curved Bezier) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <motion.path
            d={isLeft ? "M 500 100 Q 400 100, 300 100" : "M 500 100 Q 600 100, 700 100"}
            fill="none"
            stroke={status === 'completed' ? '#10b981' : status === 'active' ? '#3b82f6' : '#1e293b'}
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: status !== 'future' ? 1 : 0 }}
            transition={{ duration: 1 }}
          />
        </svg>
      </div>

      {/* Center Point Circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <motion.div
          animate={{
            scale: status === 'active' ? [1, 1.5, 1] : 1,
            backgroundColor: status === 'completed' ? '#10b981' : status === 'active' ? '#3b82f6' : '#1e293b'
          }}
          transition={{ repeat: status === 'active' ? Infinity : 0, duration: 2 }}
          className="w-6 h-6 rounded-full border-4 border-slate-950 shadow-2xl"
        />
      </div>

      {/* Main Content Box */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -100 : 100, scale: 0.8 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          "absolute w-[90%] md:w-[400px] p-8 rounded-3xl border transition-all duration-700",
          isLeft ? "right-[55%] md:right-[58%]" : "left-[55%] md:left-[58%]",
          status === 'completed' ? "border-emerald-500/50 bg-emerald-950/10" :
          status === 'active' ? "border-blue-500/50 bg-blue-950/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]" :
          "border-slate-800 bg-slate-900/30 opacity-40 grayscale"
        )}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={cn(
            "p-3 rounded-2xl bg-slate-950/50 border",
            status === 'completed' ? "border-emerald-500/30 text-emerald-400" :
            status === 'active' ? "border-blue-500/30 text-blue-400" : "border-slate-700 text-slate-500"
          )}>
            <phase.icon className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-500 tracking-tighter block uppercase">Phase {phase.number}</span>
            <h3 className="text-2xl font-black text-white leading-tight">{phase.title}</h3>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {phase.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {phase.skills.map(skill => (
            <span key={skill} className="px-3 py-1 rounded-lg bg-slate-950/50 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            {status === 'completed' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : status === 'active' ? (
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />
              </motion.div>
            ) : (
              <Circle className="h-4 w-4 text-slate-700" />
            )}
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              status === 'completed' ? "text-emerald-500" : status === 'active' ? "text-blue-500" : "text-slate-700"
            )}>
              {status}
            </span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 italic">
            {status === 'active' ? 'Signal Incoming...' : status === 'completed' ? 'Synced' : 'Waiting...'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
