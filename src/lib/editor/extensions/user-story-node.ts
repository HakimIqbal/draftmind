import { Node, mergeAttributes } from '@tiptap/core';

export const UserStoryNode = Node.create({
  name: 'prdUserStory',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      id: { default: '' },
      role: { default: '' },
      want: { default: '' },
      benefit: { default: '' },
      acceptanceCriteria: { default: '[]' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prd-user-story"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'prd-user-story',
        class: 'prd-user-story-node',
      }),
      0,
    ];
  },
});
