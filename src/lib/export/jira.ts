/**
 * Convert PRD content to Jira-compatible wiki markup.
 * Jira uses its own markup: h1. heading, *bold*, _italic_, {code}...{code}
 */

interface PRDSection {
  title: string;
  content: string;
}

export function prdToJiraMarkup(title: string, sections: PRDSection[]): string {
  const lines: string[] = [];

  lines.push(`h1. ${title}`);
  lines.push('');

  for (const section of sections) {
    lines.push(`h2. ${section.title}`);
    lines.push(convertToJira(section.content));
    lines.push('');
  }

  return lines.join('\n');
}

function convertToJira(markdown: string): string {
  let text = markdown;

  // Code blocks: ```lang\n...\n``` -> {code:lang}...{code}
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const langAttr = lang ? `:${lang}` : '';
    return `{code${langAttr}}\n${code.trim()}\n{code}`;
  });

  // Inline code: `text` -> {{text}}
  text = text.replace(/`([^`]+)`/g, '{{$1}}');

  // Bold: **text** -> *text*
  text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // Italic: _text_ stays as _text_ (same in Jira)

  // Strikethrough: ~~text~~ -> -text-
  text = text.replace(/~~(.*?)~~/g, '-$1-');

  // Headings: # text -> h1. text (etc.)
  text = text.replace(/^######\s+(.+)$/gm, 'h6. $1');
  text = text.replace(/^#####\s+(.+)$/gm, 'h5. $1');
  text = text.replace(/^####\s+(.+)$/gm, 'h4. $1');
  text = text.replace(/^###\s+(.+)$/gm, 'h3. $1');
  text = text.replace(/^##\s+(.+)$/gm, 'h2. $1');
  text = text.replace(/^#\s+(.+)$/gm, 'h1. $1');

  // Links: [text](url) -> [text|url]
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]');

  // Unordered lists: - item -> * item
  text = text.replace(/^-\s+/gm, '* ');

  // Ordered lists: 1. item -> # item
  text = text.replace(/^\d+\.\s+/gm, '# ');

  // Blockquotes: > text -> {quote}text{quote}
  text = text.replace(/^>\s+(.+)$/gm, '{quote}$1{quote}');

  return text;
}
