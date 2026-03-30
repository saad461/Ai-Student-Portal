'use client';

import { TechRoadmap } from '@/components/tech-roadmap';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RoadmapPage() {
  return (
    <main className="flex-1 p-4 lg:p-8 overflow-x-hidden relative bg-slate-950 text-white selection:bg-blue-500/30">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 animate-pulse" />
        </div>

        <section className="relative z-10 pt-24 pb-12 px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-blue-400"
            >
              <Zap className="h-4 w-4 fill-current" />
              Zohan Ali &bull; Professional Roadmap
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl font-black tracking-tight"
            >
              The AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400">
                Full-Stack Architect
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
            >
              Our curriculum follows a modular implementation strategy. We don&apos;t just teach isolated skills;
              we build a cohesive ecosystem where each new domain serves as a functional upgrade to the previous one.
              From the structural integrity of Web Architecture to the autonomous decision-making of Agentic AI,
              our roadmap is designed to transform you into a <strong>Full-Stack AI Architect</strong>.
            </motion.p>
          </div>
        </section>

        <section className="relative z-10 pb-40">
          <TechRoadmap />
        </section>

        <section className="relative z-10 py-24 px-8 border-t border-white/5 bg-slate-900/20 backdrop-blur-3xl">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">Ready to Begin the Journey?</h2>
            <p className="text-slate-400 text-lg">
              Unlock your potential with our immersive learning experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <button className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto sm:mx-0">
                  Browse Courses <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all hover:scale-105 active:scale-95 mx-auto sm:mx-0">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="relative z-10 py-12 text-center border-t border-white/5 text-slate-500 text-sm font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Zohan Ali Portal &bull; Designed for Professional Growth
        </footer>
    </main>
  );
}
