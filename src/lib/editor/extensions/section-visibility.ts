import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const SECTION_VISIBILITY_KEY = new PluginKey('sectionVisibility');

export interface SectionVisibilityStorage {
  hiddenSections: string[];
  sectionLabelToKey: Record<string, string>;
}

function buildDecorations(
  doc: EditorState['doc'],
  hiddenSections: string[],
  sectionLabelToKey: Record<string, string>,
): DecorationSet {
  if (hiddenSections.length === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  // Find section boundaries by H2 headings
  const sections: { from: number; to: number; key: string }[] = [];
  let curStart = -1;
  let curKey: string | null = null;

  doc.forEach((node, offset) => {
    if (node.type.name === 'heading') {
      const text = node.textContent.toLowerCase().trim();
      const key = sectionLabelToKey[text];
      // Only known section labels are section boundaries (skip sub-sections like "In Scope")
      if (key) {
        if (curKey && curStart >= 0) {
          sections.push({ from: curStart, to: offset, key: curKey });
        }
        curKey = key;
        curStart = offset;
      }
    }
  });

  // Close last section
  if (curKey && curStart >= 0) {
    sections.push({ from: curStart, to: doc.content.size, key: curKey });
  }

  // Create node decorations for hidden sections
  for (const sec of sections) {
    if (!hiddenSections.includes(sec.key)) continue;

    // Decorate each top-level node in this range
    doc.forEach((node, offset) => {
      if (offset >= sec.from && offset < sec.to) {
        decorations.push(
          Decoration.node(offset, offset + node.nodeSize, {
            class: 'section-hidden',
            style: 'display: none !important;',
          }),
        );
      }
    });
  }

  return DecorationSet.create(doc, decorations);
}

/**
 * Tiptap extension that hides PRD sections via ProseMirror Decorations.
 * Content stays intact in the document — only visually hidden.
 * Uses storage (mutable) instead of options (immutable after init).
 */
export const SectionVisibility = Extension.create({
  name: 'sectionVisibility',

  addStorage() {
    return {
      hiddenSections: [] as string[],
      sectionLabelToKey: {} as Record<string, string>,
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage as SectionVisibilityStorage;

    return [
      new Plugin({
        key: SECTION_VISIBILITY_KEY,

        state: {
          init(_: unknown, state: EditorState) {
            return buildDecorations(state.doc, storage.hiddenSections, storage.sectionLabelToKey);
          },
          apply(
            tr: Transaction,
            oldSet: DecorationSet,
            _oldState: EditorState,
            newState: EditorState,
          ) {
            if (tr.docChanged || tr.getMeta('sectionVisibilityUpdate')) {
              return buildDecorations(
                newState.doc,
                storage.hiddenSections,
                storage.sectionLabelToKey,
              );
            }
            return oldSet;
          },
        },

        props: {
          decorations(state: EditorState) {
            return SECTION_VISIBILITY_KEY.getState(state) as DecorationSet;
          },
        },
      }),
    ];
  },
});
