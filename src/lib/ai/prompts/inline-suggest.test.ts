import { describe, expect, it } from 'vitest';
import { buildInlineSuggestPrompt } from './inline-suggest';

const baseInput = {
  selectedText: 'Users need a faster onboarding flow with fewer manual steps.',
  sectionKey: 'requirements',
  surroundingContext: 'This PRD is for a B2B SaaS product.',
};

describe('buildInlineSuggestPrompt', () => {
  it('constrains every AI Assist action to produce drop-in PRD edits without unsupported facts', () => {
    const prompt = buildInlineSuggestPrompt({ ...baseInput, action: 'rewrite' });

    expect(prompt).toContain(
      'Do not invent facts, names, dates, numbers, metrics, owners, or scope',
    );
    expect(prompt).toContain('Only perform the selected feature: Rewrite');
    expect(prompt).toContain('no bundled or bonus edits');
    expect(prompt).toContain('Preserve the selected text language');
    expect(prompt).toContain('exactly 3 variations');
    expect(prompt).toContain('direct drop-in replacement');
  });

  it('defines strict behavior for Translate Auto-detect ID↔EN', () => {
    const prompt = buildInlineSuggestPrompt({ ...baseInput, action: 'translate' });

    expect(prompt).toContain('Translate Auto-detect ID↔EN');
    expect(prompt).toContain('This feature only translates text');
    expect(prompt).toContain('If input is Bahasa Indonesia -> translate to English');
    expect(prompt).toContain('If input is English -> translate to Bahasa Indonesia');
    expect(prompt).toContain('Do not summarize, rewrite, expand, or improve beyond translation');
  });

  it('keeps Fix Grammar limited to language errors only', () => {
    const prompt = buildInlineSuggestPrompt({ ...baseInput, action: 'grammar' });

    expect(prompt).toContain('Only perform the selected feature: Fix Grammar');
    expect(prompt).toContain('This feature only fixes language errors');
    expect(prompt).toContain('Do not rewrite correct sentences for style');
    expect(prompt).toContain('If there are no errors, return the text unchanged');
  });

  it('keeps table/list conversion tightly formatted for replacement', () => {
    const tablePrompt = buildInlineSuggestPrompt({ ...baseInput, action: 'to_table' });
    const listPrompt = buildInlineSuggestPrompt({ ...baseInput, action: 'to_list' });

    expect(tablePrompt).toContain('Output only a markdown table inside the text field');
    expect(tablePrompt).toContain('Do not add prose before or after the table');
    expect(listPrompt).toContain('Output only a flat bullet list using "- "');
    expect(listPrompt).toContain('No intro sentence, no closing sentence, no nested bullets');
  });
});
