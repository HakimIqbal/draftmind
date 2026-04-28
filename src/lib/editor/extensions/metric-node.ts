import { Node, mergeAttributes } from '@tiptap/core';

export const MetricNode = Node.create({
  name: 'prdMetric',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      id: { default: '' },
      name: { default: '' },
      baseline: { default: '' },
      target: { default: '' },
      measurementWindow: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prd-metric"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'prd-metric',
        class: 'prd-metric-node',
      }),
      0,
    ];
  },
});
