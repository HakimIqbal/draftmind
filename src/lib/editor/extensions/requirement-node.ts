import { Node, mergeAttributes } from '@tiptap/core';

export const RequirementNode = Node.create({
  name: 'prdRequirement',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      id: { default: '' },
      priority: { default: '' },
      title: { default: '' },
      description: { default: '' },
      dependencies: { default: '[]' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prd-requirement"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'prd-requirement',
        class: 'prd-requirement-node',
      }),
      0,
    ];
  },
});
