'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Code,
  ShieldCheck,
  Timer,
  Zap,
  ArrowRight,
  Sparkles,
  Bot,
  Brain,
  Rocket,
  Terminal,
  Trophy,
  Github,
  Menu,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UnifiedLoginForm } from '@/components/unified-login-form';
import { TechRoadmap } from '@/components/tech-roadmap';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
      }
      setCheckingAuth(false);
    }
    checkUser();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 font-sans antialiased overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      {/* Modern Header */}
      <header className={`px-6 lg:px-12 h-20 flex items-center border-b border-white/5 sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl h-16' : 'bg-transparent'}`}>
        <Link className="flex items-center gap-3 group" href="/">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
            <Code className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase group-hover:text-blue-400 transition-colors">Daurix Project</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-8 items-center">
          <Link className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors" href="#features">Features</Link>
          <Link className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors" href="#curriculum">Roadmap</Link>
          {isLoggedIn ? (
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-[10px]">
              <Link href="/dashboard">Access Portal</Link>
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button asChild variant="ghost" className="text-slate-400 hover:text-white uppercase font-black tracking-widest text-[10px]">
                <Link href="/enroll">Enroll</Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-[10px] border border-white/10">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          )}
        </nav>
        {/* Mobile Menu Button */}
        <div className="md:hidden ml-auto">
           <Button variant="ghost" size="icon" className="text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
           </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 md:hidden bg-slate-950 pt-20"
        >
          <nav className="flex flex-col items-center gap-8 p-8">
            <Link className="text-lg font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors" href="#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link className="text-lg font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors" href="#curriculum" onClick={() => setMobileMenuOpen(false)}>Roadmap</Link>
            {isLoggedIn ? (
              <Button asChild variant="default" className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl h-14 font-bold uppercase tracking-widest text-sm" onClick={() => setMobileMenuOpen(false)}>
                <Link href="/dashboard">Access Portal</Link>
              </Button>
            ) : (
              <div className="flex flex-col w-full gap-4">
                <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-white uppercase font-black tracking-widest text-sm h-14" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/enroll">Enroll</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full text-white hover:bg-white/10 rounded-xl h-14 font-bold uppercase tracking-widest text-sm border border-white/10" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            )}
          </nav>
        </motion.div>
      )}

      <main className="flex-1 relative z-10">
        {/* Immersive Hero Section */}
        <section className="w-full pt-20 pb-32 lg:pt-40 lg:pb-52 overflow-hidden">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-xs font-black uppercase tracking-[0.2em] text-blue-400 animate-in fade-in slide-in-from-top-4">
                  <Sparkles className="h-3 w-3" />
                  Engineering the Future of AI
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                  THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">DAURIX</span> <br />
                  PROJECT.
                </h1>
                <p className="max-w-[600px] text-slate-400 text-lg md:text-xl leading-relaxed font-medium">
                  A high-performance ecosystem for the next generation of software engineers. Master full-stack systems and agentic AI through deep work.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 h-14 px-10 text-lg font-black uppercase tracking-[0.1em] rounded-2xl group shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">
                    <Link href="/enroll">
                      Start Training
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-black uppercase tracking-[0.1em] rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white active:scale-95 transition-all">
                    <Link href="#features">Explore Features</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative min-h-[400px] flex items-center justify-center"
              >
                {checkingAuth ? (
                   <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Initializing System...</p>
                   </div>
                ) : !isLoggedIn ? (
                   <UnifiedLoginForm />
                ) : (
                   <div className="w-full p-8 bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-3xl text-center space-y-6">
                      <div className="h-24 w-24 bg-blue-600/20 rounded-3xl mx-auto flex items-center justify-center">
                         <Rocket className="h-12 w-12 text-blue-500 animate-bounce" />
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter">System Online</h3>
                      <p className="text-slate-400 font-medium">Your session is active. Proceed to your personalized command center.</p>
                      <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-500 h-14 rounded-2xl font-black uppercase tracking-widest">
                         <Link href="/dashboard">Enter Portal</Link>
                      </Button>
                   </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="w-full py-32 bg-slate-900/20 relative">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="max-w-3xl mb-24">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6">Built for <span className="text-blue-500">Peak</span> Performance</h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                We&apos;ve removed all distractions to create a high-fidelity environment focused on one thing: your technical mastery.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Timer,
                  title: "Deep Work Sync",
                  desc: "Integrated binaural beats and Pomodoro tracking to optimize neural pathways.",
                  color: "text-blue-500"
                },
                {
                  icon: ShieldCheck,
                  title: "Strict Room",
                  desc: "A distraction-free IDE environment with 3-strike accountability protocol.",
                  color: "text-emerald-500"
                },
                {
                  icon: Bot,
                  title: "AI Peer Review",
                  desc: "Instant line-by-line code reviews powered by agentic AI architects.",
                  color: "text-purple-500"
                },
                {
                  icon: Zap,
                  title: "Student Sparks",
                  desc: "Gamified progression system where every commit earns you high-value Sparks.",
                  color: "text-amber-500"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap Preview Section */}
        <section id="curriculum" className="w-full py-32">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">The Technical <span className="text-purple-500">Traverse</span></h2>
              <p className="text-slate-400 text-xl font-medium">A multi-phase journey from fundamental architecture to autonomous AI systems.</p>
            </div>

            <TechRoadmap />

            <div className="mt-20 text-center">
               <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 h-14 px-12 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 text-white transition-all">
                  <Link href="/enroll">Join the Next Cohort</Link>
               </Button>
            </div>
          </div>
        </section>

        {/* Technical Capabilities Section */}
        <section className="w-full py-32 bg-slate-950 border-t border-white/5">
           <div className="container px-6 md:px-12 mx-auto">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                 <div className="space-y-8">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[1.1]">Elite Command <br /> Infrastructure</h2>
                    <div className="space-y-6">
                       {[
                         { title: "Line-by-Line AI Review", icon: Brain, desc: "Every assignment is cross-referenced by our AI logic engine." },
                         { title: "Real-time Support Hub", icon: Terminal, desc: "1-on-1 direct channel with senior engineering instructors." },
                         { title: "Skill-Locked Shop", icon: Trophy, desc: "Redeem your Sparks for high-level technical resources." },
                         { title: "GitHub Mastery Sync", icon: Github, desc: "Deep integration with your professional development workflow." }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-4 group">
                            <div className="h-10 w-10 shrink-0 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                               <item.icon className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                               <h4 className="font-black uppercase tracking-widest text-sm text-white">{item.title}</h4>
                               <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="relative group">
                    <div className="absolute inset-0 bg-blue-600/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="aspect-square bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                       <div className="h-10 bg-slate-800 flex items-center px-4 gap-2">
                          <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Terminal_Input.v1</span>
                       </div>
                       <div className="p-8 font-mono text-xs md:text-sm space-y-4">
                          <p className="text-emerald-500">daurix@admin:~$ fetch-metrics --latest</p>
                          <div className="space-y-2 pl-4 border-l border-emerald-500/20">
                             <p className="text-slate-400"><span className="text-blue-400">Status:</span> SYSTEM_STABLE</p>
                             <p className="text-slate-400"><span className="text-blue-400">Total_Commits:</span> 24,192</p>
                             <p className="text-slate-400"><span className="text-blue-400">AI_Reviews_Served:</span> 12.8k</p>
                             <p className="text-slate-400"><span className="text-blue-400">Active_Architects:</span> 842</p>
                          </div>
                          <p className="text-emerald-500 animate-pulse">_</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-40 border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/5 z-0" />
          <div className="container px-6 md:px-12 mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-12 leading-none">Execute Your <br /> Potential</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
               <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-500 h-16 px-16 text-xl font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all border-none shadow-2xl shadow-blue-600/20">
                  <Link href="/enroll">Join Now</Link>
               </Button>
               <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 h-16 px-16 text-xl font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-white">
                  <Link href="#curriculum">View Roadmap</Link>
               </Button>
            </div>
            <p className="mt-12 text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Access the Daurix Project 2024</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl relative z-10">
        <div className="container px-6 md:px-12 mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Code className="h-5 w-5 text-white" />
             </div>
             <span className="font-black text-xl tracking-tighter uppercase">Daurix Project</span>
          </div>
          <div className="flex gap-10">
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Privacy protocol</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Service terms</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Security docs</Link>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            &copy; 2024 Daurix Corp. All systems operational.
          </p>
        </div>
      </footer>
    </div>
  );
}
