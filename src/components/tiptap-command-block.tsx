import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps, mergeAttributes } from '@tiptap/react';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Maximize2, Minimize2 } from 'lucide-react';

const CommandBlockComponent = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || 'bash';
  const isCompact = node.attrs.isCompact || false;

  const handleCopy = () => {
    const text = node.textContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = useMemo(() => {
    const lines = node.textContent.split('\n');
    // If the last line is empty and it's not the only line, don't count it for numbering
    // but Tiptap usually handles this. Let's just use the raw split.
    return lines.length;
  }, [node.textContent]);

  return (
    <NodeViewWrapper
      className={`command-block-node relative my-4 group shadow-xl rounded-xl overflow-hidden border border-slate-800 bg-[#1e293b] transition-all duration-300 ${isCompact ? 'max-w-md mx-auto' : 'w-full'}`}
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <select
            contentEditable={false}
            defaultValue={language}
            onChange={event => updateAttributes({ language: event.target.value })}
            className="bg-slate-800 text-slate-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-slate-700 outline-none cursor-pointer hover:text-white transition-colors"
          >
            <option value="bash">Bash</option>
            <option value="javascript">JS</option>
            <option value="typescript">TS</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            contentEditable={false}
            onClick={() => updateAttributes({ isCompact: !isCompact })}
            className="h-6 px-2 text-[10px] font-bold uppercase bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded transition-all"
            title={isCompact ? "Set Full Width" : "Set Compact Width"}
          >
            {isCompact ? <Maximize2 className="h-3 w-3 mr-1" /> : <Minimize2 className="h-3 w-3 mr-1" />}
            {isCompact ? 'Full' : 'Small'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            contentEditable={false}
            onClick={handleCopy}
            className="h-6 px-2 text-[10px] font-bold uppercase bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded transition-all"
          >
            {copied ? (
              <><CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3 mr-1" /> Copy</>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            contentEditable={false}
            onClick={() => deleteNode()}
            className="h-6 px-2 text-[10px] font-bold uppercase bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 border border-red-500/20 rounded transition-all"
            title="Delete Block"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex bg-[#1e293b] py-3">
        {/* Line Numbers */}
        <div
           className="select-none text-right px-3 text-slate-600 font-mono text-sm border-r border-slate-800/50 min-w-[2.5rem] leading-[1.6]"
           contentEditable={false}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-[1.6em]">{i + 1}</div>
          ))}
        </div>

        <pre className="p-0 px-4 m-0 font-mono text-sm leading-[1.6] text-slate-300 overflow-x-auto flex-1 custom-scrollbar">
          <code className={`language-${language} block whitespace-pre`}><NodeViewContent /></code>
        </pre>
      </div>

      <style jsx global>{`
        .tiptap .command-block-node pre code {
          background: transparent !important;
          padding: 0 !important;
          display: block;
          white-space: pre !important;
          min-height: 1.6em;
        }

        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }

        /* Lowlight syntax colors - Matching One Dark style */
        .hljs-comment, .hljs-quote { color: #5c6370; font-style: italic; }
        .hljs-doctag, .hljs-keyword, .hljs-formula { color: #c678dd; }
        .hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst { color: #e06c75; }
        .hljs-literal { color: #56b6c2; }
        .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: #98c379; }
        .hljs-built_in, .hljs-class .hljs-title { color: #e6c07b; }
        .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: #d19a66; }
        .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title { color: #61afef; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
        .hljs-link { text-decoration: underline; }
      `}</style>
    </NodeViewWrapper>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const CommandBlock = CodeBlockLowlight.extend({
  name: 'commandBlock',

  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: null as any,
      defaultLanguage: 'bash',
      languageClassPrefix: 'language-',
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      enableTabIndentation: true,
      tabSize: 2,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'bash',
      },
      isCompact: {
        default: false,
        parseHTML: element => element.getAttribute('data-compact') === 'true',
        renderHTML: attributes => {
          return { 'data-compact': attributes.isCompact }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="commandBlock"]',
        preserveWhitespace: 'full',
      },
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['code', { class: node.attrs.language ? `language-${node.attrs.language}` : null }, 0],
    ]
  },

  addCommands() {
    return {
      toggleCommandBlock: () => ({ commands }: any) => {
        return (commands as any).toggleNode(this.name);
      },
    } as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(CommandBlockComponent);
  },
}).configure({
  lowlight: {} as any,
});
