'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  BookOpen,
  Loader2,
  MessageSquare,
  ChevronRight,
  Type,
  Layers,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface AIExplainSectionProps {
  lectureId: string;
  lectureTitle: string;
  lectureContent: string;
}

interface ParagraphExplanation {
  original: string;
  explanation: string;
  loading: boolean;
}

export function AIExplainSection({ lectureTitle, lectureContent }: AIExplainSectionProps) {
  const [language, setLanguage] = useState<'english' | 'roman-urdu'>('roman-urdu');
  const [paragraphExplanations, setParagraphExplanations] = useState<ParagraphExplanation[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [keyTerms, setKeyTerms] = useState<string | null>(null);
  const [specificQuery, setSpecificQuery] = useState('');
  const [specificAnswer, setSpecificAnswer] = useState<string | null>(null);
  const [loadingSpecific, setLoadingSpecific] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingKeyTerms, setLoadingKeyTerms] = useState(false);
  const [hasGeneratedParagraphs, setHasGeneratedParagraphs] = useState(false);

  // Split content into meaningful paragraphs for explanation
  const paragraphs = useMemo(() => {
    if (!lectureContent) return [];
    return lectureContent
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 30); // Ignore very short lines (headings/meta)
  }, [lectureContent]);

  const generateParagraphExplanations = useCallback(async () => {
    if (hasGeneratedParagraphs || paragraphs.length === 0) return;
    setHasGeneratedParagraphs(true);

    // Initialize state with all paragraphs in loading state
    const initialExps = paragraphs.map(p => ({ original: p, explanation: '', loading: true }));
    setParagraphExplanations(initialExps);

    // Process them in sequence to avoid hitting rate limits too hard
    for (let i = 0; i < paragraphs.length; i++) {
      try {
        const res = await fetch('/api/ai-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'paragraph-explain',
            content: paragraphs[i],
            lectureTitle,
            language: 'roman-urdu' // Paragraph by paragraph is always Roman Urdu per user request
          })
        });
        const data = await res.json();
        setParagraphExplanations(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], explanation: data.answer, loading: false };
          return updated;
        });
      } catch {
        setParagraphExplanations(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], explanation: "Explaination generate nahi ho saki. Please refresh karein.", loading: false };
          return updated;
        });
      }
    }
  }, [hasGeneratedParagraphs, paragraphs, lectureTitle]);

  useEffect(() => {
    generateParagraphExplanations();
  }, [generateParagraphExplanations]);

  const handleSummarize = async () => {
    setLoadingSummary(true);
    setSummary(null);
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          content: lectureContent,
          lectureTitle,
          language
        })
      });
      const data = await res.json();
      setSummary(data.answer);
    } catch {
      setSummary("Error generating summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleKeyTerms = async () => {
    setLoadingKeyTerms(true);
    setKeyTerms(null);
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'key-terms',
          content: lectureContent,
          lectureTitle,
          language
        })
      });
      const data = await res.json();
      setKeyTerms(data.answer);
    } catch {
      setKeyTerms("Error identifying key terms.");
    } finally {
      setLoadingKeyTerms(false);
    }
  };

  const handleSpecificQuery = async () => {
    if (!specificQuery.trim()) return;
    setLoadingSpecific(true);
    setSpecificAnswer(null);
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'specific',
          content: lectureContent,
          lectureTitle,
          language,
          specificInput: specificQuery
        })
      });
      const data = await res.json();
      setSpecificAnswer(data.answer);
    } catch {
      setSpecificAnswer("Error explaining specific input.");
    } finally {
      setLoadingSpecific(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-8">
         <div className="space-y-1">
            <h2 className="text-3xl font-black flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              AI Deep Explain
            </h2>
            <p className="text-muted-foreground font-medium">Get a detailed breakdown of this lecture in Roman Urdu.</p>
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
            <Button
              variant={language === 'roman-urdu' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('roman-urdu')}
              className="rounded-xl h-10 px-6 font-bold"
            >
              Roman Urdu
            </Button>
            <Button
              variant={language === 'english' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('english')}
              className="rounded-xl h-10 px-6 font-bold"
            >
              English
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Explanation Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-primary/70 mb-4">
             <Layers className="h-5 w-5" />
             Paragraph by Paragraph Breakdown
          </div>

          <div className="space-y-12">
            {paragraphExplanations.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="relative group"
              >
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary transition-colors rounded-full hidden md:block" />
                <div className="bg-white dark:bg-slate-900 border rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-6">
                    <div>
                       <Badge variant="outline" className="mb-4 text-[10px] uppercase font-bold text-slate-400">Original Paragraph {i+1}</Badge>
                       <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic border-l-4 border-slate-100 dark:border-slate-800 pl-4">
                          {item.original}
                       </p>
                    </div>

                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                       <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none mb-4 text-[10px] uppercase font-black tracking-widest px-3 py-1">
                          AI Explanation (Roman Urdu)
                       </Badge>
                       {item.loading ? (
                         <div className="flex items-center gap-3 text-sm text-slate-400 font-bold py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            AI is explaining this part...
                         </div>
                       ) : (
                         <div className="prose prose-sm dark:prose-invert max-w-none text-slate-900 dark:text-white font-bold leading-relaxed text-lg">
                           <ReactMarkdown>{item.explanation}</ReactMarkdown>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Tools Column */}
        <div className="space-y-8">
           <div className="sticky top-24 space-y-6">
              <Card className="rounded-3xl border-2 border-primary/10 shadow-xl overflow-hidden bg-slate-900 text-white border-none">
                 <CardHeader className="bg-primary p-6">
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                       <MessageSquare className="h-5 w-5" /> Quick Insights
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80 font-medium">Explain this lecture in {language === 'english' ? 'English' : 'Roman Urdu'}</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                    <Button
                      onClick={handleSummarize}
                      disabled={loadingSummary}
                      className="w-full justify-between h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-none group"
                    >
                       <span className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Short Summary
                       </span>
                       {loadingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                    </Button>

                    <Button
                      onClick={handleKeyTerms}
                      disabled={loadingKeyTerms}
                      className="w-full justify-between h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-none group"
                    >
                       <span className="flex items-center gap-3">
                          <Type className="h-5 w-5 text-green-400" />
                          List Key Terms
                       </span>
                       {loadingKeyTerms ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                    </Button>
                 </CardContent>
              </Card>

              {/* Specific Question Box */}
              <Card className="rounded-3xl border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 p-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                       <Search className="h-5 w-5" />
                    </div>
                    <div>
                       <div className="text-sm font-black uppercase tracking-widest">Confused?</div>
                       <div className="text-[10px] text-muted-foreground font-bold">Ask about a word or line</div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <Input
                      placeholder="e.g. Yeh function kiya karta hai?"
                      className="h-12 rounded-xl border-slate-200"
                      value={specificQuery}
                      onChange={(e) => setSpecificQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSpecificQuery()}
                    />
                    <Button
                      onClick={handleSpecificQuery}
                      disabled={loadingSpecific || !specificQuery.trim()}
                      className="w-full h-12 rounded-xl font-bold gap-2"
                    >
                       {loadingSpecific ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                       Get Answer
                    </Button>
                 </div>
              </Card>

              {/* Display Area for Insights */}
              {(summary || keyTerms || specificAnswer) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="rounded-3xl border-2 border-green-500/20 bg-green-50/30 dark:bg-green-950/10 overflow-hidden shadow-lg">
                    <CardHeader className="pb-2 border-b border-green-500/10">
                       <CardTitle className="text-sm font-black flex items-center gap-2 text-green-600">
                          {summary ? <BookOpen className="h-4 w-4" /> : keyTerms ? <Type className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                          {summary ? 'Lecture Summary' : keyTerms ? 'Key Terms' : 'Your Answer'}
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                       <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-bold">
                          <ReactMarkdown>{summary || keyTerms || specificAnswer || ''}</ReactMarkdown>
                       </div>
                    </CardContent>
                    <div className="p-4 bg-green-500/5 flex justify-end">
                       <Button variant="ghost" size="sm" onClick={() => { setSummary(null); setKeyTerms(null); setSpecificAnswer(null); }} className="text-[10px] uppercase font-bold text-green-600 h-8">
                          Clear View
                       </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
