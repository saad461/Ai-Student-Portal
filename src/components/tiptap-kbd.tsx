import { Mark, mergeAttributes } from '@tiptap/core';

export const Kbd = Mark.create({
  name: 'kbd',

  parseHTML() {
    return [
      {
        tag: 'kbd',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'kbd',
      mergeAttributes(HTMLAttributes, {
        class: 'px-1.5 py-0.5 rounded-md border border-b-2 border-slate-200 bg-slate-100 font-mono text-[0.8em] font-bold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 mx-0.5',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toggleKbd: () => ({ commands }: { commands: any }) => {
        return commands.toggleMark(this.name);
      },
    } as unknown as Record<string, unknown>;
  },
});
