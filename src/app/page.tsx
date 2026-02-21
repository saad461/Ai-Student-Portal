'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BookOpen,
  Code,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
      }
    }
    checkUser();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <Link className="flex items-center justify-center" href="/">
          <Code className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-xl tracking-tight uppercase">Pro Dev Portal</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors flex items-center" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors flex items-center" href="#curriculum">
            Curriculum
          </Link>
          {isLoggedIn ? (
            <Button asChild variant="default" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/enroll">Enroll Now</Link>
              </Button>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
          <div className="container px-4 md:px-6 relative z-10 mx-auto text-center">
            <div className="inline-block rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary mb-6 animate-bounce">
              Enrollment Open for 2024
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Master Full-Stack <span className="text-primary italic">Development</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl mt-6">
              A comprehensive 24-week intensive training program designed to take you from basics to professional grade software engineering.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
              <Button asChild size="lg" className="rounded-none px-8 text-lg font-bold group">
                <Link href="/enroll">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-none px-8 text-lg font-bold border border-white bg-transparent text-white hover:bg-white hover:text-black transition-colors">
                <Link href="#curriculum">View Curriculum</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 bg-muted/50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">The Portal Experience</h2>
              <p className="mt-4 text-muted-foreground max-w-[800px] mx-auto text-lg">
                More than just a course, it&apos;s a productivity-driven environment built to optimize your learning.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background border rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Timer className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold uppercase">Deep Work Timer</h3>
                <p className="text-muted-foreground">
                  Integrated binaural beats and Pomodoro tracking to help you enter the flow state and stay there.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background border rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold uppercase">Accountability</h3>
                <p className="text-muted-foreground">
                  Our unique automated accountability system ensures you stay on track with daily punch-ins and missed-task penalties.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background border rounded-lg hover:shadow-lg transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold uppercase">Hacker Theme</h3>
                <p className="text-muted-foreground">
                  Unlock the immersive "Pro" theme as you progress, transforming your workspace into a terminal-inspired environment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Preview */}
        <section id="curriculum" className="w-full py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">Master Every Aspect of Software Engineering</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Our curriculum is battle-tested and updated for 2024, focusing on the stack used by modern tech giants.
                </p>
                <ul className="space-y-4">
                  {[
                    "Phase 1: Foundations (HTML5, CSS3, JS ES6+)",
                    "Phase 2: Modern Frontend (React 19, Next.js 15, Tailwind CSS v4)",
                    "Phase 3: Backend & Data (Supabase, PostgreSQL, Serverless)",
                    "Phase 4: Scaling & Dev Ops (CI/CD, Vercel, Testing)",
                    "Phase 5: Real-World Capstone Project"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-video bg-black rounded-lg border-4 border-muted overflow-hidden shadow-2xl flex flex-col">
                  <div className="h-8 bg-muted flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="ml-4 text-xs font-mono opacity-50">curriculum.sh — 120x40</div>
                  </div>
                  <div className="p-6 font-mono text-sm text-green-500">
                    <p className="mb-2">jules@pro-dev:~$ list-modules</p>
                    <p className="text-white">Week 01: Setup & Web Basics</p>
                    <p className="text-white">Week 04: Advanced React Patterns</p>
                    <p className="text-white">Week 08: Backend Architecture</p>
                    <p className="text-white">Week 12: Mid-term Assessment</p>
                    <p className="text-white">Week 16: Security & Auth</p>
                    <p className="text-white">Week 24: Final Graduation Project</p>
                    <p className="mt-4 animate-pulse">_</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-20 border-t bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6">Ready to Level Up Your Career?</h2>
            <p className="mx-auto max-w-[600px] mb-10 text-primary-foreground/80 md:text-xl">
              Don&apos;t wait for the right moment. The right moment is now. Join our next cohort today.
            </p>
            <Button asChild size="lg" variant="secondary" className="rounded-none px-12 text-lg font-bold">
              <Link href="/enroll">Enroll Now</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 border-t bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <Code className="h-5 w-5 text-primary mr-2" />
            <span className="font-bold">PRO DEV PORTAL</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Pro Dev Training. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm hover:underline">Privacy Policy</Link>
            <Link href="#" className="text-sm hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
