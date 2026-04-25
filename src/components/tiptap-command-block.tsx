import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CommandBlockComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || 'bash';

  const handleCopy = () => {
    const text = node.textContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = useMemo(() => {
    return node.textContent.split('\n').length;
  }, [node.textContent]);

  return (
    <NodeViewWrapper className="command-block-node relative my-8 group shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-[#1e293b]">
      {/* Header / Copy Button */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-md transition-all"
        >
          {copied ? (
            <><CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3 mr-1" /> Copy</>
          )}
        </Button>
      </div>

      {/* Language Selector */}
      <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <select
          contentEditable={false}
          defaultValue={language}
          onChange={event => updateAttributes({ language: event.target.value })}
          className="bg-slate-800 text-slate-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-slate-700 outline-none"
        >
          <option value="bash">Bash</option>
          <option value="javascript">JS</option>
          <option value="typescript">TS</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="python">Python</option>
        </select>
      </div>

      <div className="flex pt-12">
        {/* Line Numbers */}
        <div
           className="select-none text-right px-4 text-[#475569] font-mono text-sm border-r border-slate-700 min-w-[3rem]"
           contentEditable={false}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <pre className="p-0 px-6 m-0 font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto flex-1">
          <code className={`language-${language}`}>
             <NodeViewContent />
          </code>
        </pre>
      </div>

      <style jsx global>{`
        .tiptap .command-block-node pre code {
          background: transparent !important;
          padding: 0 !important;
          display: block;
          white-space: pre !important;
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

export const CommandBlock = CodeBlockLowlight.extend({
  name: 'commandBlock',

  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: null,
      defaultLanguage: 'bash',
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'bash',
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

  addNodeView() {
    return ReactNodeViewRenderer(CommandBlockComponent);
  },
}).configure({
  lowlight: {},
});

function mergeAttributes(...args: any[]) {
    return args.reduce((acc, val) => ({ ...acc, ...val }), {});
}
