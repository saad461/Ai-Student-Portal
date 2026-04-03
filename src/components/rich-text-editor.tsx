'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { FloatingMenu as FloatingMenuExtension } from '@tiptap/extension-floating-menu';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension, InputRule } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

// Custom WordReplacer extension to replace "Odin" with "daurix"
const WordReplacer = Extension.create({
  name: 'wordReplacer',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPastedText(text) {
            return text.replace(/\bodin\b/gi, 'daurix');
          },
          transformPastedHTML(html) {
            if (typeof window === 'undefined') return html;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (node.textContent) {
                node.textContent = node.textContent.replace(/\bodin\b/gi, 'daurix');
              }
            }
            return doc.body.innerHTML;
          },
        },
      }),
    ];
  },
  addInputRules() {
    return [
      // Replaces "odin" with "daurix" when followed by a space or punctuation
      new InputRule({
        find: /\bodin([\s\.,!?;:])$/i,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const punctuation = match[1];
          tr.replaceWith(range.from, range.to, state.schema.text(`daurix${punctuation}`));
        },
      }),
      // Also catch "odin" if it's the end of a line/block
      new InputRule({
        find: /\bodin$/i,
        handler: ({ state, range }) => {
          const { tr } = state;
          tr.replaceWith(range.from, range.to, state.schema.text('daurix'));
        },
      }),
    ];
  },
});

// Custom FontSize extension as it's not in the official package
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    } as unknown as Record<string, unknown>;
  },
});
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { FontFamily } from '@tiptap/extension-font-family';
import { Typography } from '@tiptap/extension-typography';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Baseline,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Undo,
  Redo,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Link2Off,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Upload,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { uploadImageAction } from '@/app/admin/actions';
import { useRef, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { useConfirmation } from '@/components/ui/confirmation-provider';
import { CalloutExtension } from './tiptap-callout';
import { CollapsibleExtension, CollapsibleTitle, CollapsibleContent } from './tiptap-collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, XCircle, LayoutPanelTop, Trash2 } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

interface MenuBarProps {
  editor: Editor | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddCallout: () => void;
  onAddCollapsible: () => void;
}

const MenuBar = ({ editor, fileInputRef, isUploading, handleFileUpload, onAddCallout, onAddCollapsible }: MenuBarProps) => {
  const { prompt: customPrompt } = useConfirmation();
  if (!editor) {
    return null;
  }

  const addLink = async () => {
    const url = await customPrompt({
      title: 'Insert Link',
      description: 'Enter the destination URL',
      placeholder: 'https://example.com',
      confirmText: 'Insert'
    });
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = async () => {
    const url = await customPrompt({
      title: 'Insert Image URL',
      description: 'Enter the image URL',
      placeholder: 'https://example.com/image.png',
      confirmText: 'Insert'
    });
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-slate-50 dark:bg-slate-900 sticky top-[var(--editor-sticky-top,0px)] z-10">
      {/* Text Styles */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive('bold') && 'bg-slate-200 dark:bg-slate-800')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive('italic') && 'bg-slate-200 dark:bg-slate-800')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(editor.isActive('underline') && 'bg-slate-200 dark:bg-slate-800')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(editor.isActive('strike') && 'bg-slate-200 dark:bg-slate-800')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* Colors & Font */}
      <div className="flex gap-1 items-center">
        <div className="flex items-center relative group">
          <Input
            type="color"
            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer z-10 opacity-0"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            title="Text Color"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Baseline className="h-4 w-4" />
            <div
              className="absolute bottom-1 w-3 h-1 bg-black"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || 'black' }}
            />
          </div>
        </div>

        <div className="flex items-center relative group">
          <Input
            type="color"
            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer z-10 opacity-0"
            onInput={(e) => editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()}
            title="Highlight Color"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Highlighter className="h-4 w-4" />
            <div
              className="absolute bottom-1 w-3 h-1 bg-yellow-400"
              style={{ backgroundColor: editor.getAttributes('highlight').color || '#facc15' }}
            />
          </div>
        </div>

        <select
          className="h-8 text-xs bg-transparent border rounded px-1 w-24"
          onChange={(e) => {
            if (e.target.value === 'default') {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(e.target.value).run();
            }
          }}
          title="Font Family"
        >
          <option value="default">Default Font</option>
          <option value="Inter">Inter</option>
          <option value="Comic Sans MS, Comic Sans">Comic Sans</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="cursive">Cursive</option>
        </select>

        <select
          className="h-8 text-xs bg-transparent border rounded px-1 w-20"
          onChange={(e) => {
            if (e.target.value === 'default') {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
          }}
          title="Font Size"
        >
          <option value="default">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="30px">30px</option>
          <option value="36px">36px</option>
          <option value="48px">48px</option>
        </select>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* Scripts */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={cn(editor.isActive('subscript') && 'bg-slate-200 dark:bg-slate-800')}
          title="Subscript"
        >
          <SubscriptIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={cn(editor.isActive('superscript') && 'bg-slate-200 dark:bg-slate-800')}
          title="Superscript"
        >
          <SuperscriptIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* Headings */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(editor.isActive('heading', { level: 1 }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(editor.isActive('heading', { level: 2 }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(editor.isActive('heading', { level: 3 }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* Alignment */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn(editor.isActive({ textAlign: 'justify' }) && 'bg-slate-200 dark:bg-slate-800')}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* Lists & Blocks */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive('bulletList') && 'bg-slate-200 dark:bg-slate-800')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive('orderedList') && 'bg-slate-200 dark:bg-slate-800')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn(editor.isActive('taskList') && 'bg-slate-200 dark:bg-slate-800')}
          title="Task List"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(editor.isActive('blockquote') && 'bg-slate-200 dark:bg-slate-800')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(editor.isActive('codeBlock') && 'bg-slate-200 dark:bg-slate-800')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* Media & Links */}
      <div className="flex gap-1">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={addLink}
            className={cn(editor.isActive('link') && 'bg-slate-200 dark:bg-slate-800')}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            title="Remove Link"
          >
            <Link2Off className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={addImage}
          title="Image URL"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Upload Image"
        >
          <Upload className={cn("h-4 w-4", isUploading && "animate-pulse")} />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddCallout}
          title="Add Callout Card"
          className={cn(editor.isActive('callout') && 'bg-slate-200 dark:bg-slate-800')}
        >
          <LayoutPanelTop className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddCollapsible}
          title="Add Collapsible Bullet (⚡)"
          className={cn(editor.isActive('collapsible') && 'bg-slate-200 dark:bg-slate-800')}
        >
          <Zap className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      {/* History */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, placeholder }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { success, error: toastError } = useToast();
  const { prompt: customPrompt } = useConfirmation();

  const [isCalloutModalOpen, setIsCalloutModalOpen] = useState(false);
  const [editingCallout, setEditingCallout] = useState<{ title: string; color: string; icon: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadImageAction(formData);
      if (res.success && res.url) {
        success('Image uploaded successfully!');
        editor?.chain().focus().setImage({ src: res.url }).run();
      } else {
        toastError('Upload failed: ' + (typeof res.error === 'string' ? res.error : JSON.stringify(res.error)));
      }
    } catch {
      toastError('Upload error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      WordReplacer,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80 transition-colors',
        },
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      FontFamily,
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Markdown,
      BubbleMenuExtension.configure({
        pluginKey: 'bubbleMenu',
      }),
      BubbleMenuExtension.configure({
        pluginKey: 'tableBubbleMenu',
      }),
      FloatingMenuExtension.configure({
        pluginKey: 'floatingMenu',
      }),
      CalloutExtension,
      CollapsibleExtension,
      CollapsibleTitle,
      CollapsibleContent,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      // Get the markdown content from Tiptap
      const markdown = (editor.storage as unknown as Record<string, { getMarkdown: () => string }>).markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[400px] p-4',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const handleNodeClick = () => {
      const { selection } = editor.state;
      const node = (selection as unknown as { node?: { type: { name: string }, attrs: Record<string, string> } }).node;

      if (node && node.type.name === 'callout') {
        setEditingCallout({
          title: node.attrs.title,
          color: node.attrs.color,
          icon: node.attrs.icon,
        });
        setIsCalloutModalOpen(true);
      }
    };

    editor.on('selectionUpdate', handleNodeClick);
    return () => {
      editor.off('selectionUpdate', handleNodeClick);
    };
  }, [editor]);

  const handleSaveCallout = () => {
    if (!editor || !editingCallout) return;

    const { selection } = editor.state;
    const node = (selection as unknown as { node?: { type: { name: string } } }).node;

    if (node && node.type.name === 'callout') {
      // Update existing
      editor.chain().focus().updateAttributes('callout', editingCallout).run();
    } else {
      // Insert new
      editor.chain().focus().insertContent({
        type: 'callout',
        attrs: editingCallout,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enter important content here...' }] }],
      }).run();
    }

    setIsCalloutModalOpen(false);
    setEditingCallout(null);
  };

  const handleDeleteCallout = () => {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run();
    setIsCalloutModalOpen(false);
    setEditingCallout(null);
  };

  return (
    <div className="border rounded-md bg-white dark:bg-slate-950 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all relative">
      <MenuBar
        editor={editor}
        fileInputRef={fileInputRef}
        isUploading={isUploading}
        handleFileUpload={handleFileUpload}
        onAddCallout={() => {
          setEditingCallout({ title: 'Important Information', color: 'blue', icon: 'info' });
          setIsCalloutModalOpen(true);
        }}
        onAddCollapsible={() => {
          (editor as unknown as { commands: { setCollapsible: () => void } }).commands.setCollapsible();
        }}
      />

      <Dialog open={isCalloutModalOpen} onOpenChange={(open) => !open && setIsCalloutModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editor?.isActive('callout') ? 'Edit Callout Card' : 'Add Callout Card'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Card Title</Label>
              <Input
                value={editingCallout?.title || ''}
                onChange={(e) => setEditingCallout(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="e.g. Pro Tip, Warning, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Border Color</Label>
                <select
                  className="w-full p-2 rounded border bg-background text-sm"
                  value={editingCallout?.color || 'blue'}
                  onChange={(e) => setEditingCallout(prev => prev ? { ...prev, color: e.target.value } : null)}
                >
                  <option value="blue">Blue (Info)</option>
                  <option value="orange">Orange (Warning)</option>
                  <option value="green">Green (Success)</option>
                  <option value="red">Red (Error)</option>
                  <option value="gray">Gray (Note)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <select
                  className="w-full p-2 rounded border bg-background text-sm"
                  value={editingCallout?.icon || 'info'}
                  onChange={(e) => setEditingCallout(prev => prev ? { ...prev, icon: e.target.value } : null)}
                >
                  <option value="info">Info Circle</option>
                  <option value="warning">Triangle Warning</option>
                  <option value="success">Check Circle</option>
                  <option value="help">Question Circle</option>
                  <option value="error">X Circle</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Preview:</div>
              <div className={cn(
                "flex-1 flex items-center gap-2 p-2 border-l-4 rounded-r-md text-xs font-bold",
                editingCallout?.color === 'blue' && "border-blue-500 bg-blue-50 text-blue-700",
                editingCallout?.color === 'orange' && "border-orange-500 bg-orange-50 text-orange-700",
                editingCallout?.color === 'green' && "border-green-500 bg-green-50 text-green-700",
                editingCallout?.color === 'red' && "border-red-500 bg-red-50 text-red-700",
                editingCallout?.color === 'gray' && "border-slate-500 bg-slate-50 text-slate-700",
              )}>
                {editingCallout?.icon === 'info' && <Info className="h-3 w-3" />}
                {editingCallout?.icon === 'warning' && <AlertTriangle className="h-3 w-3" />}
                {editingCallout?.icon === 'success' && <CheckCircle2 className="h-3 w-3" />}
                {editingCallout?.icon === 'help' && <HelpCircle className="h-3 w-3" />}
                {editingCallout?.icon === 'error' && <XCircle className="h-3 w-3" />}
                {editingCallout?.title}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            {editor?.isActive('callout') ? (
              <Button variant="ghost" className="text-destructive font-bold" onClick={handleDeleteCallout}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Card
              </Button>
            ) : <div />}
            <Button onClick={handleSaveCallout} className="font-bold">
              {editor?.isActive('callout') ? 'Update Card' : 'Insert Callout Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editor && (
        <>
          <BubbleMenu
            editor={editor}
            pluginKey="bubbleMenu"
            shouldShow={({ state, from, to }) => {
              return from !== to && !state.selection.empty && !editor.isActive('image');
            }}
            className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-1 gap-0.5 z-[9999]"
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", editor.isActive('bold') && 'bg-slate-100 dark:bg-slate-800 text-primary')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", editor.isActive('italic') && 'bg-slate-100 dark:bg-slate-800 text-primary')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", editor.isActive('underline') && 'bg-slate-100 dark:bg-slate-800 text-primary')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", editor.isActive('strike') && 'bg-slate-100 dark:bg-slate-800 text-primary')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 1 }) && 'bg-slate-100 dark:bg-slate-800 text-primary')}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 2 }) && 'bg-slate-100 dark:bg-slate-800 text-primary')}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <div className="flex items-center relative h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <Input
                type="color"
                className="absolute inset-0 w-full h-full p-0 border-none bg-transparent cursor-pointer z-10 opacity-0"
                onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
              />
              <div className="flex items-center justify-center w-full h-full pointer-events-none">
                <Baseline className="h-4 w-4" />
              </div>
            </div>

            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0", editor.isActive('link') && 'text-primary bg-slate-100 dark:bg-slate-800')}
                onClick={async () => {
                  const previousUrl = editor.getAttributes('link').href || '';
                  const url = await customPrompt({
                    title: 'Edit Link',
                    description: 'Update the destination URL',
                    defaultValue: String(previousUrl),
                    placeholder: 'https://example.com',
                    confirmText: 'Update'
                  });
                  if (url === '') {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  } else if (url) {
                    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                  }
                }}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              {editor.isActive('link') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  <Link2Off className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <select
              className="h-7 text-[10px] border rounded bg-transparent px-1 outline-none"
              onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
              value={editor.getAttributes('textStyle').fontSize || ''}
            >
              <option value="">Size</option>
              {['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </BubbleMenu>

          <BubbleMenu
            editor={editor}
            pluginKey="tableBubbleMenu"
            shouldShow={({ editor }) => editor.isActive('table')}
            className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-1 gap-0.5 z-[9999]"
          >
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold" onClick={() => editor.chain().focus().addColumnBefore().run()}>+Col Left</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold" onClick={() => editor.chain().focus().addColumnAfter().run()}>+Col Right</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-red-500" onClick={() => editor.chain().focus().deleteColumn().run()}>Del Col</Button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold" onClick={() => editor.chain().focus().addRowBefore().run()}>+Row Above</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold" onClick={() => editor.chain().focus().addRowAfter().run()}>+Row Below</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-red-500" onClick={() => editor.chain().focus().deleteRow().run()}>Del Row</Button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-red-600" onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</Button>
          </BubbleMenu>

          <FloatingMenu
            editor={editor}
            pluginKey="floatingMenu"
            shouldShow={({ state }) => {
              const { $from } = state.selection;
              return $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0;
            }}
            className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-1 gap-1 z-[9999]"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4 text-slate-400 hover:text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4 text-slate-400 hover:text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="h-4 w-4 text-slate-400 hover:text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
            >
              <Upload className="h-4 w-4 text-slate-400 hover:text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title="Insert Table"
            >
              <TableIcon className="h-4 w-4 text-slate-400 hover:text-primary" />
            </Button>
          </FloatingMenu>
        </>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};
