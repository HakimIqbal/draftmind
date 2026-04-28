/**
 * Convert PRD content to Slack mrkdwn format.
 * Slack uses its own markup syntax: *bold*, _italic_, ~strike~, ```code```, > blockquote
 */

interface PRDSection {
  title: string;
  content: string;
}

export function prdToSlackMrkdwn(title: string, sections: PRDSection[]): string {
  const lines: string[] = [];

  lines.push(`*${escapeSlack(title)}*`);
  lines.push('');

  for (const section of sections) {
    lines.push(`*${escapeSlack(section.title)}*`);
    lines.push(convertToSlack(section.content));
    lines.push('');
  }

  return lines.join('\n');
}

function escapeSlack(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertToSlack(markdown: string): string {
  let text = markdown;

  // Bold: **text** or __text__ -> *text*
  text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  text = text.replace(/__(.*?)__/g, '*$1*');

  // Italic: *text* or _text_ -> _text_
  // (already _ in Slack so single underscores stay as-is)
  // Handle single asterisk italic -> underscore
  text = text.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '_$1_');

  // Strikethrough: ~~text~~ -> ~text~
  text = text.replace(/~~(.*?)~~/g, '~$1~');

  // Headings: # text -> *text*
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');

  // Links: [text](url) -> <url|text>
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  // Bullet lists: keep as-is (Slack renders them)

  // Escape special chars in remaining text
  text = text.replace(/&/g, '&amp;').replace(/(?<!<)>(?![\s\S]*\|)/g, '&gt;');

  return text;
}
