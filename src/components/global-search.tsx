'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Layout, Github, Zap, Milestone, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CurriculumItem } from '@/lib/curriculum';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const staticLinks = [
    { title: 'Dashboard', href: '/dashboard', icon: Layout, category: 'Navigation' },
    { title: 'Learning Path', href: '/roadmap', icon: Milestone, category: 'Navigation' },
    { title: 'Attendance', href: '/attendance', icon: Clock, category: 'Navigation' },
    { title: 'GitHub Mastery', href: '/github-mastery', icon: Github, category: 'Navigation' },
    { title: 'Deep Work Timer', href: '/timer', icon: Zap, category: 'Navigation' },
    { title: 'Phase 1: Foundations', href: '/roadmap', icon: Milestone, category: 'Roadmap' },
    { title: 'Phase 2: Web Architecture', href: '/roadmap', icon: Milestone, category: 'Roadmap' },
    { title: 'Phase 3: Data Intelligence', href: '/roadmap', icon: Milestone, category: 'Roadmap' },
    { title: 'Phase 4: Cognitive AI', href: '/roadmap', icon: Milestone, category: 'Roadmap' },
    { title: 'Phase 5: Agentic AI', href: '/roadmap', icon: Milestone, category: 'Roadmap' },
  ];

  const search = React.useCallback(async (q: string) => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);

    const { data: curriculum } = await supabase
      .from('curriculum')
      .select('id, title, type, description')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(5);

    const formattedResults = (curriculum || []).map(item => ({
       title: item.title,
       href: item.type === 'lecture' ? `/lecture/${item.id}` : '/curriculum',
       icon: item.type === 'lecture' ? FileText : Zap,
       category: 'Curriculum'
    }));

    const filteredStatic = staticLinks.filter(l =>
        l.title.toLowerCase().includes(q.toLowerCase())
    );

    setResults([...filteredStatic, ...formattedResults]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const onSelect = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-muted transition-colors w-full max-w-[200px]"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search lectures, assignments, and tools..."
                className="border-none focus-visible:ring-0 text-lg p-0"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No results found for "{query}".
              </div>
            )}

            {!query && results.length === 0 && (
              <div className="p-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Suggestions</p>
                 <div className="space-y-1">
                    {staticLinks.map(link => (
                      <button
                        key={link.href}
                        onClick={() => onSelect(link.href)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                      >
                        <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium">{link.title}</span>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                 {['Navigation', 'Curriculum', 'Roadmap'].map(cat => {
                    const catResults = results.filter(r => r.category === cat);
                    if (catResults.length === 0) return null;
                    return (
                      <div key={cat} className="p-2">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">{cat}</p>
                         <div className="space-y-1">
                            {catResults.map((res, i) => (
                              <button
                                key={i}
                                onClick={() => onSelect(res.href)}
                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                              >
                                <res.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                <div className="flex-1">
                                  <div className="font-medium">{res.title}</div>
                                </div>
                              </button>
                            ))}
                         </div>
                      </div>
                    )
                 })}
              </div>
            )}
          </div>
          <div className="p-3 border-t bg-muted/30 flex justify-between items-center text-[10px] font-medium text-muted-foreground">
             <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">Enter</kbd> to select</span>
                <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">Esc</kbd> to close</span>
             </div>
             <div>Global Portal Search v1.0</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
