'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Copy, Check, Terminal, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeCompilerProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  onChange?: (codes: { html: string; css: string; js: string }) => void;
  className?: string;
  isDark?: boolean;
}

export function CodeCompiler({
  initialHtml = '<h1>Hello World</h1>',
  initialCss = 'h1 { color: #10b981; }',
  initialJs = 'console.log("Compiler active!");',
  onChange,
  className,
  isDark = false
}: CodeCompilerProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{line?: number, message: string, type: 'html' | 'css' | 'js'}[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const validateCode = useCallback(() => {
    const newErrors: typeof errors = [];

    // Basic JS Syntax Validation
    if (js.trim()) {
        try {
            new Function(js);
        } catch (e) {
            const err = e as Error;
            // Try to extract line number from error message if possible
            const lineMatch = err.stack?.match(/<anonymous>:(\d+):(\d+)/);
            newErrors.push({
                line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                message: err.message,
                type: 'js'
            });
        }
    }

    // Basic CSS Validation (checks for unclosed braces)
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
        newErrors.push({
            message: `Unbalanced braces: ${openBraces} open, ${closeBraces} closed.`,
            type: 'css'
        });
    }

    // Basic HTML Validation (checks for unclosed tags)
    const tags = html.match(/<[a-zA-Z]+/g) || [];
    const closingTags = html.match(/<\/[a-zA-Z]+/g) || [];
    // Self-closing tags list
    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const filteredTags = tags.filter(t => !selfClosing.some(sc => t.startsWith('<' + sc)));

    if (filteredTags.length > closingTags.length) {
        newErrors.push({
            message: "Likely unclosed HTML tags detected.",
            type: 'html'
        });
    }

    setErrors(newErrors);
  }, [html, css, js]);

  useEffect(() => {
    const timer = setTimeout(validateCode, 1000);
    return () => clearTimeout(timer);
  }, [validateCode]);

  useEffect(() => {
    onChange?.({ html, css, js });
  }, [html, css, js, onChange]);

  const runCode = () => {
    if (!iframeRef.current) return;

    const documentContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; color: ${isDark ? '#e2e8f0' : '#1a202c'}; background: ${isDark ? '#0f172a' : '#fff'}; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            (function() {
              const originalLog = console.log;
              const originalError = console.error;

              console.log = function(...args) {
                window.parent.postMessage({ type: 'log', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') }, '*');
                originalLog.apply(console, args);
              };

              console.error = function(...args) {
                window.parent.postMessage({ type: 'error', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') }, '*');
                originalError.apply(console, args);
              };

              window.onerror = function(message, source, lineno, colno, error) {
                window.parent.postMessage({ type: 'error', content: message + " (Line: " + lineno + ")" }, '*');
                return true;
              };

              try {
                ${js}
              } catch (err) {
                window.parent.postMessage({ type: 'error', content: err.message }, '*');
              }
            })();
          </script>
        </body>
      </html>
    `;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(documentContent);
      iframeDoc.close();
    }
    setOutput('');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'log') {
        setOutput(prev => prev + '> ' + event.data.content + '\n');
      } else if (event.data.type === 'error') {
        setOutput(prev => prev + 'Error: ' + event.data.content + '\n');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const copyCode = () => {
    const code = activeTab === 'html' ? html : activeTab === 'css' ? css : js;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeErrors = errors.filter(e => e.type === activeTab);

  return (
    <div className={cn("border rounded-2xl overflow-hidden bg-slate-950 shadow-2xl flex flex-col min-h-[500px]", className)}>
      <div className="bg-slate-900/80 p-2 flex items-center justify-between border-b border-slate-800 backdrop-blur-sm">
        <div className="flex gap-1">
          {['html', 'css', 'js'].map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 text-[10px] font-black px-4 rounded-md tracking-tighter transition-all",
                activeTab === tab
                  ? (tab === 'html' ? "bg-blue-500/20 text-blue-400" : tab === 'css' ? "bg-purple-500/20 text-purple-400" : "bg-yellow-500/20 text-yellow-400")
                  : "text-slate-500 hover:text-slate-300"
              )}
          onClick={() => setActiveTab(tab as 'html' | 'css' | 'js')}
            >
              {tab.toUpperCase()}
              {errors.some(e => e.type === tab) && (
                <div className="ml-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-300" onClick={copyCode}>
             {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
           </Button>
           <Button
            variant="default"
            size="sm"
            className="h-8 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] gap-2 px-4 rounded-full"
            onClick={runCode}
           >
             <Play className="h-3 w-3 fill-current" /> EXECUTE
           </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">
          <div className="flex-1 relative group">
             <textarea
                className={cn(
                    "w-full h-full bg-transparent p-6 text-slate-300 font-mono text-sm resize-none focus:outline-none scrollbar-hide transition-all",
                    activeErrors.length > 0 && "ring-1 ring-red-500/20"
                )}
                spellCheck={false}
                value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                onChange={(e) => {
                   if (activeTab === 'html') setHtml(e.target.value);
                   else if (activeTab === 'css') setCss(e.target.value);
                   else setJs(e.target.value);
                }}
              />

              {/* Error Indicators */}
              {activeErrors.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom duration-300">
                    {activeErrors.map((err, i) => (
                        <div key={i} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg text-[10px] font-bold backdrop-blur-md mb-2">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{err.message} {err.line ? `(Line: ${err.line})` : ''}</span>
                        </div>
                    ))}
                </div>
              )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
           <div className="h-6 bg-slate-100 flex items-center px-4 gap-2 border-b">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REAL-TIME RENDERER</span>
           </div>
           <iframe
             ref={iframeRef}
             className="flex-1 w-full bg-white border-none"
             title="Compiler Preview"
           />
           {output && (
             <div className="h-32 bg-slate-900 border-t border-slate-800 overflow-y-auto p-4 font-mono text-xs">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-tighter text-[10px]">
                        <Terminal className="h-3 w-3" /> Console Output
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 text-[8px] uppercase font-black text-slate-600"
                        onClick={() => setOutput('')}
                    >
                        Clear
                    </Button>
                </div>
                <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
