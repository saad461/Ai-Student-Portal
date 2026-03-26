'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Copy, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeCompilerProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  onChange?: (codes: { html: string; css: string; js: string }) => void;
}

export function CodeCompiler({
  initialHtml = '<h1>Hello World</h1>',
  initialCss = 'h1 { color: blue; }',
  initialJs = 'console.log("Compiler active!");',
  onChange
}: CodeCompilerProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);

  useEffect(() => {
    onChange?.({ html, css, js });
  }, [html, css, js, onChange]);
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runCode = () => {
    if (!iframeRef.current) return;

    const documentContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>
            (function() {
              const originalLog = console.log;
              console.log = function(...args) {
                window.parent.postMessage({ type: 'log', content: args.join(' ') }, '*');
                originalLog.apply(console, args);
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

  return (
    <div className="border rounded-2xl overflow-hidden bg-slate-950 shadow-2xl flex flex-col h-[600px]">
      <div className="bg-slate-900 p-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs font-bold px-4 rounded-md", activeTab === 'html' ? "bg-slate-800 text-blue-400" : "text-slate-400")}
            onClick={() => setActiveTab('html')}
          >
            INDEX.HTML
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs font-bold px-4 rounded-md", activeTab === 'css' ? "bg-slate-800 text-purple-400" : "text-slate-400")}
            onClick={() => setActiveTab('css')}
          >
            STYLE.CSS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs font-bold px-4 rounded-md", activeTab === 'js' ? "bg-slate-800 text-yellow-400" : "text-slate-400")}
            onClick={() => setActiveTab('js')}
          >
            SCRIPT.JS
          </Button>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={copyCode}>
             {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
           </Button>
           <Button variant="default" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2" onClick={runCode}>
             <Play className="h-3 w-3 fill-current" /> RUN CODE
           </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-slate-800">
          <textarea
            className="w-full h-full bg-transparent p-6 text-slate-300 font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
            value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
            onChange={(e) => {
               if (activeTab === 'html') setHtml(e.target.value);
               else if (activeTab === 'css') setCss(e.target.value);
               else setJs(e.target.value);
            }}
          />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
           <div className="h-6 bg-slate-100 flex items-center px-4 gap-2 border-b">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Preview</span>
           </div>
           <iframe
             ref={iframeRef}
             className="flex-1 w-full bg-white border-none"
             title="Compiler Preview"
           />
           {output && (
             <div className="h-1/3 bg-slate-900 border-t border-slate-800 overflow-y-auto p-4 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-500 mb-2 font-bold uppercase tracking-tighter">
                   <Terminal className="h-3 w-3" /> Console Output
                </div>
                <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
