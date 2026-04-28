import { Node, mergeAttributes } from '@tiptap/core';

export const ObjectiveNode = Node.create({
  name: 'prdObjective',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      id: { default: '' },
      statement: { default: '' },
      measurableOutcome: { default: '' },
      priority: { default: 'should_have' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prd-objective"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'prd-objective',
        class: 'prd-objective-node',
      }),
      0,
    ];
  },
});
