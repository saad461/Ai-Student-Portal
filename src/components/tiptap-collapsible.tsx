import { Node, mergeAttributes, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Zap, ChevronRight } from 'lucide-react';

// --- Collapsible Parent Node ---
export const CollapsibleExtension = Node.create({
  name: 'collapsible',
  group: 'block',
  content: 'collapsibleTitle collapsibleContent',
  draggable: true,

  addAttributes() {
    return {
      isOpen: {
        default: true, // Always open in editor for editing
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'collapsible', class: 'collapsible-section' }), 0];
  },

  addCommands() {
    return {
      setCollapsible: () => ({ commands }: { commands: RawCommands }) => {
        return commands.insertContent({
          type: this.name,
          content: [
            { type: 'collapsibleTitle', content: [{ type: 'text', text: 'New Collapsible Section' }] },
            { type: 'collapsibleContent', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add your collapsible content here...' }] }] },
          ],
        })
      },
    } as unknown as Record<string, unknown>;
  },

  addNodeView() {
    return ReactNodeViewRenderer(() => {
      return (
        <NodeViewWrapper className="my-4 border rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <NodeViewContent />
          </div>
        </NodeViewWrapper>
      );
    });
  },
});

// --- Collapsible Title Node ---
export const CollapsibleTitle = Node.create({
  name: 'collapsibleTitle',
  content: 'inline*',
  selectable: false,
  marks: 'bold', // Encourage/default to bold

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible-title"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'collapsible-title', class: 'collapsible-title font-bold' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(() => {
      return (
        <div className="flex items-center gap-3 p-4 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <Zap className="h-4 w-4 text-black fill-black shrink-0" />
          <div className="flex-1 font-bold">
            <NodeViewContent className="inline" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
        </div>
      );
    });
  },
});

// --- Collapsible Content Node ---
export const CollapsibleContent = Node.create({
  name: 'collapsibleContent',
  content: 'block+',
  selectable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible-content"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'collapsible-content', class: 'collapsible-content p-4' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(() => {
      return (
        <div className="p-4 bg-white dark:bg-slate-950/50">
          <NodeViewContent />
        </div>
      );
    });
  },
});
