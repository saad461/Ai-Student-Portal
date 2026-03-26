'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Code,
  Database,
  Sparkles,
  Bot,
  Cpu,
  Globe,
  Terminal,
  Activity,
  Layers,
  Zap,
  LayoutTemplate,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoadmapPhase {
  id: number;
  title: string;
  tagline: string;
  goal: string;
  skills: string[];
  toolbox: { name: string; icon: React.ElementType }[];
  color: string;
  glowColor: string;
  icon: React.ElementType;
}

const PHASES: RoadmapPhase[] = [
  {
    id: 1,
    title: "01. The Foundation",
    tagline: "Digital Core",
    goal: "Establishing the structural core of modern interfaces and interactive experiences.",
    skills: ["HTML5", "CSS3", "Tailwind", "JavaScript (ES6+)"],
    toolbox: [
      { name: "HTML5", icon: Globe },
      { name: "CSS3", icon: Layers },
      { name: "Tailwind", icon: Zap },
      { name: "JavaScript", icon: Terminal }
    ],
    color: "text-blue-500",
    glowColor: "bg-blue-500",
    icon: LayoutTemplate
  },
  {
    id: 2,
    title: "02. Web Architecture",
    tagline: "Full-Stack Systems",
    goal: "Building scalable, high-performance web ecosystems that serve as the 'body' for AI.",
    skills: ["Next.js", "React", "Node.js", "PostgreSQL"],
    toolbox: [
      { name: "Next.js", icon: Globe },
      { name: "React", icon: Cpu },
      { name: "Node.js", icon: Terminal },
      { name: "PostgreSQL", icon: Database }
    ],
    color: "text-emerald-500",
    glowColor: "bg-emerald-500",
    icon: Globe
  },
  {
    id: 3,
    title: "03. Data Intelligence",
    tagline: "Analytical Mind",
    goal: "Clean, process, and visualize raw data to extract actionable business insights.",
    skills: ["Python", "Pandas", "NumPy", "SQL", "Visualization"],
    toolbox: [
      { name: "Python", icon: Terminal },
      { name: "Pandas", icon: Activity },
      { name: "SQL", icon: Database },
      { name: "NumPy", icon: Cpu }
    ],
    color: "text-purple-500",
    glowColor: "bg-purple-500",
    icon: Database
  },
  {
    id: 4,
    title: "04. Cognitive AI",
    tagline: "Generative Integration",
    goal: "Integrating generative 'brains' into apps so they can think, chat, and generate content.",
    skills: ["LLMs", "OpenAI/Gemini APIs", "Vector DBs (Pinecone)", "RAG Systems"],
    toolbox: [
      { name: "OpenAI", icon: Sparkles },
      { name: "Pinecone", icon: Layers },
      { name: "Gemini", icon: Zap },
      { name: "Weaviate", icon: Database }
    ],
    color: "text-pink-500",
    glowColor: "bg-pink-500",
    icon: Brain
  },
  {
    id: 5,
    title: "05. Agentic AI",
    tagline: "Autonomous Operations",
    goal: "Creating self-operating systems that perform complex tasks with zero human intervention.",
    skills: ["LangChain", "CrewAI", "Autonomous Task Automation", "Multi-agent orchestration"],
    toolbox: [
      { name: "LangChain", icon: Code },
      { name: "CrewAI", icon: Bot },
      { name: "AutoGPT", icon: Zap },
      { name: "Automation", icon: Cpu }
    ],
    color: "text-amber-500",
    glowColor: "bg-amber-500",
    icon: Bot
  }
];

export function TechRoadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(1);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    async function fetchProgress() {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;

       const { data: profile } = await supabase.from('profiles').select('current_course_id').eq('id', user.id).single();
       const { data: submissions } = await supabase.from('submissions').select('curriculum_id').eq('student_id', user.id);
       const { data: modules } = await supabase.from('modules').select('index').eq('course_id', profile?.current_course_id).order('index', { ascending: true });

       if (modules && modules.length > 0) {
          const completedCount = submissions?.length || 0;
          const phase = Math.min(5, Math.floor(completedCount / 5) + 1);
          setCurrentModuleIndex(phase);
       }
    }
    fetchProgress();
  }, []);

  return (
    <div ref={containerRef} className="relative max-w-6xl mx-auto py-20 px-6">
      {/* Central Connectivity Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2 hidden md:block" />

      {/* Progress Glow Line */}
      <motion.div
        style={{ scaleY, originY: 0 }}
        className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 via-pink-500 to-amber-500 -translate-x-1/2 z-10 blur-[1px] hidden md:block"
      />

      <div className="space-y-24 md:space-y-40">
        {PHASES.map((phase, index) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            isLeft={index % 2 === 0}
            isCurrent={phase.id === currentModuleIndex}
            isCompleted={phase.id < currentModuleIndex}
          />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, isLeft, isCurrent, isCompleted }: { phase: RoadmapPhase, isLeft: boolean, isCurrent?: boolean, isCompleted?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col md:flex-row items-center gap-8 w-full",
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      )}
    >
      {/* Central Connector Dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
        <div className={cn(
          "h-4 w-4 rounded-full transition-all duration-1000",
          isCurrent ? "bg-white scale-150 shadow-[0_0_25px_rgba(255,255,255,1)]" :
          isCompleted ? "bg-green-500 scale-110" : "bg-slate-700",
          phase.glowColor
        )} />
        {isCurrent && (
          <motion.div
            layoutId="glow"
            className="absolute inset-0 rounded-full bg-white opacity-50 blur-md"
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      {/* Content Card */}
      <div className={cn(
        "w-full md:w-1/2 group",
        isLeft ? "md:text-right" : "md:text-left"
      )}>
        <div className={cn(
          "relative p-8 rounded-3xl border transition-all duration-500 overflow-hidden",
          isCurrent ? "border-primary/50 bg-slate-900/80 shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)] ring-1 ring-primary/20 scale-[1.02]" :
          "border-white/10 bg-slate-900/50 backdrop-blur-xl hover:border-white/20 hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-black/50"
        )}>
          {/* Status Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            {isCurrent && (
               <Badge className="bg-primary text-primary-foreground border-none animate-pulse text-[10px] font-black tracking-tighter">
                  ACTIVE PHASE
               </Badge>
            )}
            {isCompleted && (
               <Badge className="bg-green-500 text-white border-none text-[10px] font-black tracking-tighter">
                  PHASE COMPLETED
               </Badge>
            )}
          </div>

          {/* Subtle Mesh Gradient Overlay */}
          <div className={cn(
            "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20 transition-opacity group-hover:opacity-40",
            phase.glowColor
          )} />

          <div className={cn(
            "flex items-center gap-4 mb-4",
            isLeft ? "md:flex-row-reverse" : "md:flex-row"
          )}>
            <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10", phase.color)}>
              <phase.icon className="h-8 w-8" />
            </div>
            <div>
              <h3 className={cn("text-xs font-bold uppercase tracking-widest", phase.color)}>
                {phase.tagline}
              </h3>
              <h2 className="text-2xl font-black text-white">{phase.title}</h2>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed mb-6">
            {phase.goal}
          </p>

          <div className={cn(
            "flex flex-wrap gap-2 mb-8",
            isLeft ? "md:justify-end" : "md:justify-start"
          )}>
            {phase.skills.map(skill => (
              <Badge key={skill} className="bg-white/5 text-slate-300 border-white/10 hover:bg-white/10">
                {skill}
              </Badge>
            ))}
          </div>

          {/* Toolbox Tooltip Area */}
          <div className={cn(
            "flex items-center gap-4 pt-6 border-t border-white/5",
            isLeft ? "md:justify-end" : "md:justify-start"
          )}>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">Toolbox</span>
            <div className="flex gap-3">
              {phase.toolbox.map(tool => (
                <div key={tool.name} className="group/tool relative cursor-help">
                  <tool.icon className="h-5 w-5 text-slate-400 transition-colors hover:text-white" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover/tool:opacity-100 transition-opacity z-50">
                    {tool.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Phase Number (Mobile or Side) */}
      <div className={cn(
        "hidden lg:block w-1/2 text-[10rem] font-black opacity-5 select-none transition-all duration-700 group-hover:opacity-10 pointer-events-none",
        isLeft ? "text-left pl-20" : "text-right pr-20"
      )}>
        0{phase.id}
      </div>
    </motion.div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium border",
      className
    )}>
      {children}
    </span>
  );
}
