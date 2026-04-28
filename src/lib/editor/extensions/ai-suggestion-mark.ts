import { Mark, mergeAttributes } from '@tiptap/core';

export const AISuggestionMark = Mark.create({
  name: 'aiSuggestion',

  addAttributes() {
    return {
      suggestionId: { default: '' },
      provider: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-ai-suggestion]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-ai-suggestion': '',
        class: 'ai-suggestion-mark',
        style: 'border-bottom: 2px solid var(--accent); padding-bottom: 1px;',
      }),
      0,
    ];
  },
});
