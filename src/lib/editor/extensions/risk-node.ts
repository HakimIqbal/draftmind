import { Node, mergeAttributes } from '@tiptap/core';

export const RiskNode = Node.create({
  name: 'prdRisk',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      id: { default: '' },
      description: { default: '' },
      likelihood: { default: '' },
      impact: { default: '' },
      mitigation: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prd-risk"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'prd-risk',
        class: 'prd-risk-node',
      }),
      0,
    ];
  },
});
