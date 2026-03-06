'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
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
  Type,
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
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { uploadImageAction } from '@/app/admin/actions';
import { useRef, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadImageAction(formData);
      if (res.success && res.url) {
        editor.chain().focus().setImage({ src: res.url }).run();
      } else {
        alert('Upload failed: ' + res.error);
      }
    } catch (err) {
      alert('Upload error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
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
              (editor.commands as any).unsetFontSize();
            } else {
              (editor.commands as any).setFontSize(e.target.value);
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
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
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
    ],
    content: content,
    onUpdate: ({ editor }) => {
      // Get the markdown content from Tiptap
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[400px] p-4',
      },
    },
  });

  return (
    <div className="border rounded-md overflow-hidden bg-white dark:bg-slate-950 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      <MenuBar editor={editor} />

      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex bg-white dark:bg-slate-900 border rounded-lg shadow-xl overflow-hidden p-1 gap-1"
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8", editor.isActive('bold') && 'bg-slate-100 dark:bg-slate-800')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8", editor.isActive('italic') && 'bg-slate-100 dark:bg-slate-800')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8", editor.isActive('underline') && 'bg-slate-100 dark:bg-slate-800')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) && 'bg-slate-100 dark:bg-slate-800')}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) && 'bg-slate-100 dark:bg-slate-800')}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};
