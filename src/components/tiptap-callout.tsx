import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeViewProps } from '@tiptap/react';

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  help: HelpCircle,
  error: XCircle,
};

const colorMap = {
  blue: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300',
  orange: 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300',
  green: 'border-green-500 bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300',
  red: 'border-red-500 bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-300',
  gray: 'border-slate-500 bg-slate-50/50 dark:bg-slate-900/10 text-slate-700 dark:text-slate-300',
};

const CalloutComponent = ({ node, selected }: NodeViewProps) => {
  const { title, color, icon } = node.attrs;
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Info;

  return (
    <NodeViewWrapper className={cn("my-6 relative group", selected && "ring-2 ring-primary ring-offset-2")}>
      <div className={cn(
        "border-l-4 rounded-r-xl p-6 shadow-sm transition-all",
        colorMap[color as keyof typeof colorMap] || colorMap.blue
      )}>
        <div className="flex items-center gap-3 mb-3 font-black uppercase tracking-tight text-sm">
          <IconComponent className="h-5 w-5 shrink-0" />
          <span>{title || 'Important Information'}</span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Important Information',
      },
      color: {
        default: 'blue',
      },
      icon: {
        default: 'info',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
        getAttrs: (element) => ({
          title: (element as HTMLElement).getAttribute('data-title'),
          color: (element as HTMLElement).getAttribute('data-color'),
          icon: (element as HTMLElement).getAttribute('data-icon'),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        'data-title': node.attrs.title,
        'data-color': node.attrs.color,
        'data-icon': node.attrs.icon,
        class: 'callout-card', // For CSS/Markdown rendering
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});
