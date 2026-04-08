import { Node, mergeAttributes, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import React from 'react';
import { Zap, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

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
            {
              type: 'collapsibleTitle',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'New Collapsible Section', marks: [{ type: 'bold' }] }]
                }
              ]
            },
            {
              type: 'collapsibleContent',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Add your collapsible content here...' }]
                }
              ]
            },
          ],
        })
      },
    } as unknown as Record<string, unknown>;
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ deleteNode }: NodeViewProps) => {
      return (
        <NodeViewWrapper className="my-4 border rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 group/collapsible relative">
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/collapsible:opacity-100 transition-opacity">
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7 rounded-full shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                deleteNode();
              }}
              title="Delete Collapsible Section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
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
  content: 'block+',
  selectable: false,
  isolating: true,
  marks: '_', // Allow all marks

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible-title"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'collapsible-title', class: 'collapsible-title font-bold' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(() => {
      return (
        <NodeViewWrapper>
          <div className="flex items-center gap-3 p-4 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 pr-12">
            <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-sm">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <div className="flex-1 font-bold">
              <NodeViewContent />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
          </div>
        </NodeViewWrapper>
      );
    });
  },
});

// --- Collapsible Content Node ---
export const CollapsibleContent = Node.create({
  name: 'collapsibleContent',
  content: 'block+',
  selectable: false,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="collapsible-content"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'collapsible-content', class: 'collapsible-content p-4' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(() => {
      return (
        <NodeViewWrapper>
          <div className="p-4 bg-white dark:bg-slate-950/50">
            <NodeViewContent />
          </div>
        </NodeViewWrapper>
      );
    });
  },
});
