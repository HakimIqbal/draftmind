import type { PRDDocument, TiptapContent } from './schema';

// ── Tiptap node types ──

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// ── Helper builders ──

function textNode(text: string, marks?: TiptapMark[]): TiptapNode {
  const node: TiptapNode = { type: 'text', text };
  if (marks && marks.length > 0) node.marks = marks;
  return node;
}

function heading(level: number, text: string): TiptapNode {
  return {
    type: 'heading',
    attrs: { level },
    content: [textNode(text)],
  };
}

function paragraph(text: string): TiptapNode {
  if (!text) return { type: 'paragraph' };

  // Simple inline bold: convert **text** to bold marks
  const parts: TiptapNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(textNode(text.slice(lastIndex, match.index)));
    }
    parts.push(textNode(match[1]!, [{ type: 'bold' }]));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(textNode(text.slice(lastIndex)));
  }

  return {
    type: 'paragraph',
    content: parts.length > 0 ? parts : [textNode(text)],
  };
}

function bulletList(items: string[]): TiptapNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

export function orderedList(items: string[]): TiptapNode {
  return {
    type: 'orderedList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

function tableRow(cells: string[], isHeader = false): TiptapNode {
  const cellType = isHeader ? 'tableHeader' : 'tableCell';
  return {
    type: 'tableRow',
    content: cells.map((cell) => ({
      type: cellType,
      content: [paragraph(cell)],
    })),
  };
}

function table(headerRow: string[], dataRows: string[][]): TiptapNode {
  return {
    type: 'table',
    content: [tableRow(headerRow, true), ...dataRows.map((row) => tableRow(row))],
  };
}

// ── PRD → Tiptap ──

export function prdToTiptap(prd: PRDDocument): TiptapDoc {
  const nodes: TiptapNode[] = [];

  // Title as H1
  nodes.push(heading(1, prd.metadata.title));

  // ── Overview ──
  nodes.push(heading(2, 'Overview'));
  if (prd.sections.overview.content?.content?.length) {
    nodes.push(...(prd.sections.overview.content.content as unknown as TiptapNode[]));
  } else {
    nodes.push(paragraph(''));
  }

  // ── Problem Statement ──
  nodes.push(heading(2, 'Problem Statement'));
  if (prd.sections.problem_statement.content?.content?.length) {
    nodes.push(...(prd.sections.problem_statement.content.content as unknown as TiptapNode[]));
  } else {
    nodes.push(paragraph(''));
  }

  // ── Objectives ──
  nodes.push(heading(2, 'Objectives'));
  if (prd.sections.objectives.length > 0) {
    const goals = prd.sections.objectives.filter((o) => o.type === 'goal');
    const nonGoals = prd.sections.objectives.filter((o) => o.type === 'non-goal');

    if (goals.length > 0) {
      nodes.push(heading(3, 'Goals'));
      nodes.push(
        bulletList(
          goals.map((obj) => {
            let text = obj.description;
            if (obj.key_results.length > 0) {
              text += ` (KRs: ${obj.key_results.join('; ')})`;
            }
            return text;
          }),
        ),
      );
    }

    if (nonGoals.length > 0) {
      nodes.push(heading(3, 'Non-Goals'));
      nodes.push(bulletList(nonGoals.map((obj) => obj.description)));
    }
  } else {
    nodes.push(paragraph(''));
  }

  // ── DARCI Matrix ──
  nodes.push(heading(2, 'DARCI Matrix'));
  const { darci } = prd.sections;
  const darciRoles: Array<[string, typeof darci.decider]> = [
    ['Decider', darci.decider],
    ['Accountable', darci.accountable],
    ['Responsible', darci.responsible],
    ['Consulted', darci.consulted],
    ['Informed', darci.informed],
  ];
  for (const [roleName, roleData] of darciRoles) {
    const people = Array.isArray(roleData) ? roleData : (roleData?.people ?? []);
    const guidelines = Array.isArray(roleData) ? '' : (roleData?.guidelines ?? '');
    if (people.length > 0 || guidelines) {
      nodes.push(heading(3, roleName));
      if (people.length > 0) {
        nodes.push(paragraph(`**${people.join(', ')}**`));
      }
      if (guidelines) {
        nodes.push(paragraph(guidelines));
      }
    }
  }

  // ── Scope ──
  nodes.push(heading(2, 'Scope'));
  nodes.push(heading(3, 'In Scope'));
  if (prd.sections.scope.in_scope.length > 0) {
    nodes.push(bulletList(prd.sections.scope.in_scope));
  } else {
    nodes.push(paragraph(''));
  }
  nodes.push(heading(3, 'Out of Scope'));
  if (prd.sections.scope.out_of_scope.length > 0) {
    nodes.push(bulletList(prd.sections.scope.out_of_scope));
  } else {
    nodes.push(paragraph(''));
  }

  // ── User Stories ──
  nodes.push(heading(2, 'User Stories'));
  if (prd.sections.user_stories.length > 0) {
    for (const story of prd.sections.user_stories) {
      nodes.push(
        paragraph(
          `**${story.id}** [${story.priority}] As a ${story.role}, I want ${story.want}, so that ${story.benefit}`,
        ),
      );
      if (story.acceptance_criteria.length > 0) {
        nodes.push(bulletList(story.acceptance_criteria.map((ac) => `AC: ${ac}`)));
      }
    }
  } else {
    nodes.push(paragraph(''));
  }

  // ── Functional Requirements ──
  nodes.push(heading(2, 'Functional Requirements'));
  if (prd.sections.functional_reqs.length > 0) {
    for (const req of prd.sections.functional_reqs) {
      nodes.push(paragraph(`**${req.id}** [${req.priority}] ${req.title}`));
      nodes.push(paragraph(req.description));
      if (req.dependencies.length > 0) {
        nodes.push(paragraph(`Dependencies: ${req.dependencies.join(', ')}`));
      }
    }
  } else {
    nodes.push(paragraph(''));
  }

  // ── Non-Functional Requirements ──
  nodes.push(heading(2, 'Non-Functional Requirements'));
  const { nfr } = prd.sections;
  const nfrItems: string[] = [];
  const nfrCategories: Array<[string, string[]]> = [
    ['Performance', nfr.performance],
    ['Security', nfr.security],
    ['Accessibility', nfr.accessibility],
    ['Scalability', nfr.scalability],
    ['Reliability', nfr.reliability],
    ['Compliance', nfr.compliance],
  ];
  for (const [label, items] of nfrCategories) {
    if (items && items.length > 0) {
      nfrItems.push(`**${label}:** ${items.join('; ')}`);
    }
  }
  if (nfrItems.length > 0) {
    nodes.push(bulletList(nfrItems));
  } else {
    nodes.push(paragraph(''));
  }

  // ── Success Metrics ──
  nodes.push(heading(2, 'Success Metrics'));
  if (prd.sections.success_metrics.length > 0) {
    nodes.push(
      table(
        ['Metric', 'Definition', 'Baseline', 'Target', 'Window'],
        prd.sections.success_metrics.map((m) => [
          m.name,
          m.definition || '-',
          m.baseline,
          m.target,
          m.measurement_window,
        ]),
      ),
    );
  } else {
    nodes.push(paragraph(''));
  }

  // ── Timeline ──
  nodes.push(heading(2, 'Timeline'));
  if (prd.sections.timeline.length > 0) {
    for (const ms of prd.sections.timeline) {
      const statusTag = ms.status ? ` [${ms.status}]` : '';
      const picTag = ms.pic ? ` — PIC: ${ms.pic}` : '';
      nodes.push(paragraph(`**${ms.title}** — ${ms.date}${statusTag}${picTag}`));
      if (ms.activity) {
        nodes.push(paragraph(ms.activity));
      }
      if (ms.deliverables.length > 0) {
        nodes.push(heading(4, 'Deliverables'));
        nodes.push(bulletList(ms.deliverables));
      }
    }
  } else {
    nodes.push(paragraph(''));
  }

  // ── Risks ──
  nodes.push(heading(2, 'Risks'));
  if (prd.sections.risks.length > 0) {
    for (const risk of prd.sections.risks) {
      nodes.push(
        paragraph(`**${risk.id}** [${risk.likelihood}/${risk.impact}] ${risk.description}`),
      );
      nodes.push(paragraph(`Mitigation: ${risk.mitigation}`));
      if (risk.owner) {
        nodes.push(paragraph(`Owner: ${risk.owner}`));
      }
    }
  } else {
    nodes.push(paragraph(''));
  }

  // ── References ──
  nodes.push(heading(2, 'References'));
  if (prd.sections.references.length > 0) {
    nodes.push(
      bulletList(
        prd.sections.references.map((ref) => {
          let text = `**${ref.title}** (${ref.type}): ${ref.url}`;
          if (ref.description) text += ` — ${ref.description}`;
          return text;
        }),
      ),
    );
  } else {
    nodes.push(paragraph(''));
  }

  // ── Glossary ──
  nodes.push(heading(2, 'Glossary'));
  if (prd.sections.glossary.length > 0) {
    nodes.push(
      bulletList(prd.sections.glossary.map((entry) => `**${entry.term}:** ${entry.definition}`)),
    );
  } else {
    nodes.push(paragraph(''));
  }

  // ── Changelog ──
  nodes.push(heading(2, 'Changelog'));
  if (prd.sections.changelog.length > 0) {
    nodes.push(
      bulletList(
        prd.sections.changelog.map(
          (entry) => `v${entry.version} (${entry.date}) by ${entry.author}: ${entry.summary}`,
        ),
      ),
    );
  } else {
    nodes.push(paragraph(''));
  }

  return { type: 'doc', content: nodes };
}

// ── Tiptap → PRD ──

/**
 * Parse a Tiptap document back into PRD structure.
 *
 * Best-effort parser. It splits the document by H2
 * headings and maps content back to the appropriate section. Rich text
 * sections (overview, problem_statement) store the raw Tiptap nodes.
 * Structured sections are parsed from text with simple heuristics.
 */
export function tiptapToPRD(doc: TiptapDoc, existingPRD: PRDDocument): PRDDocument {
  const result: PRDDocument = JSON.parse(JSON.stringify(existingPRD));
  const sections = splitByH2(doc.content);

  // Extract title from H1 if present
  const h1 = doc.content.find((n) => n.type === 'heading' && (n.attrs?.level ?? 0) === 1);
  if (h1) {
    result.metadata.title = extractText(h1);
  }

  for (const [sectionTitle, sectionNodes] of sections) {
    const key = sectionTitleToKey(sectionTitle);
    if (!key) continue;

    switch (key) {
      case 'overview':
        result.sections.overview = {
          ...result.sections.overview,
          content: { type: 'doc', content: sectionNodes as unknown as TiptapContent['content'] },
          word_count: countWords(sectionNodes),
        };
        break;

      case 'problem_statement':
        result.sections.problem_statement = {
          ...result.sections.problem_statement,
          content: { type: 'doc', content: sectionNodes as unknown as TiptapContent['content'] },
          word_count: countWords(sectionNodes),
        };
        break;

      case 'objectives':
        result.sections.objectives = parseObjectives(sectionNodes);
        break;

      case 'darci':
        result.sections.darci = parseDarci(sectionNodes, result.sections.darci);
        break;

      case 'scope':
        result.sections.scope = parseScope(sectionNodes);
        break;

      case 'user_stories':
        result.sections.user_stories = parseUserStories(sectionNodes);
        break;

      case 'functional_reqs':
        result.sections.functional_reqs = parseFunctionalReqs(sectionNodes);
        break;

      case 'nfr':
        result.sections.nfr = parseNFR(sectionNodes, result.sections.nfr);
        break;

      case 'success_metrics':
        result.sections.success_metrics = parseSuccessMetrics(sectionNodes);
        break;

      case 'timeline':
        result.sections.timeline = parseTimeline(sectionNodes);
        break;

      case 'risks':
        result.sections.risks = parseRisks(sectionNodes);
        break;

      case 'references':
        result.sections.references = parseReferences(sectionNodes);
        break;

      case 'glossary':
        result.sections.glossary = parseGlossary(sectionNodes);
        break;

      case 'changelog':
        result.sections.changelog = parseChangelog(sectionNodes);
        break;
    }
  }

  return result;
}

// ── Internal parsing helpers ──

/**
 * Split Tiptap nodes into sections based on H2 headings.
 * Returns an array of [heading text, content nodes] tuples.
 */
function splitByH2(nodes: TiptapNode[]): Array<[string, TiptapNode[]]> {
  const sections: Array<[string, TiptapNode[]]> = [];
  let currentTitle = '';
  let currentNodes: TiptapNode[] = [];

  for (const node of nodes) {
    if (node.type === 'heading' && (node.attrs?.level ?? 0) === 2) {
      if (currentTitle) {
        sections.push([currentTitle, currentNodes]);
      }
      currentTitle = extractText(node);
      currentNodes = [];
    } else if (currentTitle) {
      // Skip H1 (title) and nodes before first H2
      currentNodes.push(node);
    }
  }

  if (currentTitle) {
    sections.push([currentTitle, currentNodes]);
  }

  return sections;
}

const SECTION_TITLE_MAP: Record<string, string> = {
  overview: 'overview',
  'problem statement': 'problem_statement',
  objectives: 'objectives',
  'darci matrix': 'darci',
  darci: 'darci',
  scope: 'scope',
  'user stories': 'user_stories',
  'functional requirements': 'functional_reqs',
  'non-functional requirements': 'nfr',
  'success metrics': 'success_metrics',
  timeline: 'timeline',
  risks: 'risks',
  references: 'references',
  glossary: 'glossary',
  changelog: 'changelog',
};

function sectionTitleToKey(title: string): string | null {
  return SECTION_TITLE_MAP[title.toLowerCase().trim()] ?? null;
}

/** Recursively extract plain text from a Tiptap node. */
function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractText).join('');
}

/** Extract all text strings from a list of nodes, one per top-level node. */
export function extractTextLines(nodes: TiptapNode[]): string[] {
  return nodes.map((n) => extractText(n).trim()).filter((t) => t.length > 0);
}

/** Extract list items from bulletList / orderedList nodes. */
function extractListItems(nodes: TiptapNode[]): string[] {
  const items: string[] = [];
  for (const node of nodes) {
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const li of node.content ?? []) {
        items.push(extractText(li).trim());
      }
    }
  }
  return items;
}

function countWords(nodes: TiptapNode[]): number {
  const text = nodes.map(extractText).join(' ');
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// ── Section parsers ──

function parseObjectives(nodes: TiptapNode[]): PRDDocument['sections']['objectives'] {
  const objectives: PRDDocument['sections']['objectives'] = [];

  // Check for H3 sub-headings (Goals / Non-Goals)
  let currentType: 'goal' | 'non-goal' = 'goal';

  for (const node of nodes) {
    if (node.type === 'heading' && (node.attrs?.level ?? 0) === 3) {
      const title = extractText(node).toLowerCase();
      currentType = title.includes('non-goal') ? 'non-goal' : 'goal';
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const li of node.content ?? []) {
        const text = extractText(li).trim();
        if (!text) continue;

        // Try to extract key results from "(KRs: ...)" suffix
        const krMatch = text.match(/\(KRs?:\s*(.+)\)$/);
        const description = krMatch ? text.slice(0, krMatch.index).trim() : text;
        const keyResults = krMatch
          ? krMatch[1]!
              .split(';')
              .map((kr) => kr.trim())
              .filter(Boolean)
          : [];

        objectives.push({
          id: `OBJ-${String(objectives.length + 1).padStart(3, '0')}`,
          type: currentType,
          description,
          key_results: keyResults,
        });
      }
    }
  }

  return objectives;
}

function parseDarci(
  nodes: TiptapNode[],
  existing: PRDDocument['sections']['darci'],
): PRDDocument['sections']['darci'] {
  const result = JSON.parse(JSON.stringify(existing));

  let currentRole = '';
  for (const node of nodes) {
    if (node.type === 'heading' && (node.attrs?.level ?? 0) === 3) {
      currentRole = extractText(node).toLowerCase().trim();
    } else if (node.type === 'paragraph' && currentRole && currentRole in result) {
      const text = extractText(node).trim();
      if (!text) continue;
      const roleData = result[currentRole];
      if (Array.isArray(roleData)) {
        // Legacy format — convert to new
        const people = text
          .replace(/^\*\*|\*\*$/g, '')
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        result[currentRole] = { people, guidelines: '' };
      } else if (typeof roleData === 'object' && roleData !== null) {
        if (!roleData.people || roleData.people.length === 0) {
          roleData.people = text
            .replace(/^\*\*|\*\*$/g, '')
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
        } else {
          roleData.guidelines = (roleData.guidelines ? roleData.guidelines + ' ' : '') + text;
        }
      }
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      // Legacy fallback
      for (const li of node.content ?? []) {
        const item = extractText(li).trim();
        const match = item.match(/^(?:\*\*)?(\w+)(?:\*\*)?:\s*(.+)$/i);
        if (!match) continue;
        const role = match[1]!.toLowerCase();
        const people = match[2]!
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        if (role in result) {
          result[role] = { people, guidelines: '' };
        }
      }
    }
  }

  return result;
}

function parseScope(nodes: TiptapNode[]): PRDDocument['sections']['scope'] {
  const scope: PRDDocument['sections']['scope'] = {
    in_scope: [],
    out_of_scope: [],
  };

  let current: 'in_scope' | 'out_of_scope' = 'in_scope';

  for (const node of nodes) {
    if (node.type === 'heading' && (node.attrs?.level ?? 0) === 3) {
      const title = extractText(node).toLowerCase();
      current = title.includes('out') ? 'out_of_scope' : 'in_scope';
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const li of node.content ?? []) {
        const text = extractText(li).trim();
        if (text) scope[current].push(text);
      }
    }
  }

  return scope;
}

function parseUserStories(nodes: TiptapNode[]): PRDDocument['sections']['user_stories'] {
  const stories: PRDDocument['sections']['user_stories'] = [];
  let currentStory: PRDDocument['sections']['user_stories'][number] | null = null;

  for (const node of nodes) {
    if (node.type === 'paragraph') {
      const text = extractText(node).trim();

      // Match story pattern: **US-001** [must] As a ..., I want ..., so that ...
      const storyMatch = text.match(
        /^(?:\*\*)?([A-Z]+-\d+)(?:\*\*)?\s*(?:\[(\w+)\])?\s*As a (.+?),\s*I want (.+?),\s*so that (.+)$/i,
      );

      if (storyMatch) {
        if (currentStory) stories.push(currentStory);
        currentStory = {
          id: storyMatch[1]!,
          priority: (storyMatch[2] as 'must' | 'should' | 'could' | 'wont') ?? 'should',
          role: storyMatch[3]!,
          want: storyMatch[4]!,
          benefit: storyMatch[5]!,
          acceptance_criteria: [],
        };
      }
    } else if ((node.type === 'bulletList' || node.type === 'orderedList') && currentStory) {
      for (const li of node.content ?? []) {
        const text = extractText(li).trim();
        if (text) {
          // Strip "AC: " prefix if present
          const cleaned = text.replace(/^AC:\s*/i, '');
          currentStory.acceptance_criteria.push(cleaned);
        }
      }
    }
  }

  if (currentStory) stories.push(currentStory);
  return stories;
}

function parseFunctionalReqs(nodes: TiptapNode[]): PRDDocument['sections']['functional_reqs'] {
  const reqs: PRDDocument['sections']['functional_reqs'] = [];
  let currentReq: PRDDocument['sections']['functional_reqs'][number] | null = null;

  for (const node of nodes) {
    if (node.type === 'paragraph') {
      const text = extractText(node).trim();

      // Match: **FR-001** [must] Title
      const reqMatch = text.match(/^(?:\*\*)?([A-Z]+-\d+)(?:\*\*)?\s*\[(\w+)\]\s*(.+)$/i);

      if (reqMatch) {
        if (currentReq) reqs.push(currentReq);
        currentReq = {
          id: reqMatch[1]!,
          priority: reqMatch[2] as 'must' | 'should' | 'could' | 'wont',
          title: reqMatch[3]!,
          description: '',
          dependencies: [],
        };
      } else if (currentReq) {
        // Check for dependency line
        const depMatch = text.match(/^Dependencies:\s*(.+)$/i);
        if (depMatch) {
          currentReq.dependencies = depMatch[1]!
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean);
        } else if (!currentReq.description) {
          currentReq.description = text;
        } else {
          currentReq.description += '\n' + text;
        }
      }
    }
  }

  if (currentReq) reqs.push(currentReq);
  return reqs;
}

function parseNFR(
  nodes: TiptapNode[],
  existing: PRDDocument['sections']['nfr'],
): PRDDocument['sections']['nfr'] {
  const result = { ...existing };
  const items = extractListItems(nodes);

  for (const item of items) {
    const match = item.match(/^(?:\*\*)?(\w+)(?:\*\*)?:\s*(.+)$/i);
    if (!match) continue;
    const category = match[1]!.toLowerCase();
    const values = match[2]!
      .split(';')
      .map((v) => v.trim())
      .filter(Boolean);

    if (category in result) {
      (result as Record<string, string[]>)[category] = values;
    }
  }

  return result;
}

function parseSuccessMetrics(nodes: TiptapNode[]): PRDDocument['sections']['success_metrics'] {
  const metrics: PRDDocument['sections']['success_metrics'] = [];

  // Try to parse from table
  for (const node of nodes) {
    if (node.type === 'table') {
      const rows = node.content ?? [];
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const cells = (rows[i]!.content ?? []).map((cell) => extractText(cell).trim());
        if (cells.length >= 4) {
          metrics.push({
            id: `SM-${String(metrics.length + 1).padStart(3, '0')}`,
            name: cells[0]!,
            definition: cells.length >= 5 ? cells[1]! : '',
            baseline: cells.length >= 5 ? cells[2]! : cells[1]!,
            target: cells.length >= 5 ? cells[3]! : cells[2]!,
            measurement_window: cells.length >= 5 ? cells[4]! : cells[3]!,
          });
        }
      }
    }
  }

  // Fallback: parse from list items
  if (metrics.length === 0) {
    const items = extractListItems(nodes);
    for (const item of items) {
      metrics.push({
        id: `SM-${String(metrics.length + 1).padStart(3, '0')}`,
        name: item,
        definition: '',
        baseline: '',
        target: '',
        measurement_window: '',
      });
    }
  }

  return metrics;
}

function parseTimeline(nodes: TiptapNode[]): PRDDocument['sections']['timeline'] {
  const milestones: PRDDocument['sections']['timeline'] = [];
  let currentMilestone: PRDDocument['sections']['timeline'][number] | null = null;

  for (const node of nodes) {
    if (node.type === 'paragraph') {
      const text = extractText(node).trim();

      // Match: **Title** — 2026-04-01 [status]
      const msMatch = text.match(
        /^(?:\*\*)?(.+?)(?:\*\*)?\s*[—–-]\s*(\d{4}-\d{2}-\d{2})(?:\s*\[(\w+)\])?$/,
      );

      if (msMatch) {
        if (currentMilestone) milestones.push(currentMilestone);
        currentMilestone = {
          id: `MS-${String(milestones.length + 1).padStart(3, '0')}`,
          title: msMatch[1]!.trim(),
          date: msMatch[2]!,
          activity: '',
          deliverables: [],
          status: (msMatch[3] as 'planned' | 'in_progress' | 'completed' | 'delayed') ?? 'planned',
        };
      } else if (currentMilestone && !currentMilestone.activity) {
        currentMilestone.activity = text;
      }
    } else if ((node.type === 'bulletList' || node.type === 'orderedList') && currentMilestone) {
      for (const li of node.content ?? []) {
        const text = extractText(li).trim();
        if (text) currentMilestone.deliverables.push(text);
      }
    }
  }

  if (currentMilestone) milestones.push(currentMilestone);
  return milestones;
}

function parseRisks(nodes: TiptapNode[]): PRDDocument['sections']['risks'] {
  const risks: PRDDocument['sections']['risks'] = [];
  let currentRisk: PRDDocument['sections']['risks'][number] | null = null;

  for (const node of nodes) {
    if (node.type === 'paragraph') {
      const text = extractText(node).trim();

      // Match: **RISK-001** [high/medium] description
      const riskMatch = text.match(/^(?:\*\*)?([A-Z]+-\d+)(?:\*\*)?\s*\[(\w+)\/(\w+)\]\s*(.+)$/i);

      if (riskMatch) {
        if (currentRisk) risks.push(currentRisk);
        currentRisk = {
          id: riskMatch[1]!,
          likelihood: riskMatch[2] as 'low' | 'medium' | 'high',
          impact: riskMatch[3] as 'low' | 'medium' | 'high',
          description: riskMatch[4]!,
          mitigation: '',
        };
      } else if (currentRisk) {
        const mitMatch = text.match(/^Mitigation:\s*(.+)$/i);
        const ownerMatch = text.match(/^Owner:\s*(.+)$/i);
        if (mitMatch) {
          currentRisk.mitigation = mitMatch[1]!;
        } else if (ownerMatch) {
          currentRisk.owner = ownerMatch[1]!;
        }
      }
    }
  }

  if (currentRisk) risks.push(currentRisk);
  return risks;
}

function parseReferences(nodes: TiptapNode[]): PRDDocument['sections']['references'] {
  const refs: PRDDocument['sections']['references'] = [];
  const items = extractListItems(nodes);

  for (const item of items) {
    // Match: **Title** (type): url — description
    const match = item.match(/^(?:\*\*)?(.+?)(?:\*\*)?\s*\((\w+)\):\s*(\S+)(?:\s*[—–-]\s*(.+))?$/);

    if (match) {
      refs.push({
        id: `REF-${String(refs.length + 1).padStart(3, '0')}`,
        title: match[1]!.trim(),
        type: match[2] as 'document' | 'url' | 'figma' | 'jira' | 'slack' | 'other',
        url: match[3]!,
        description: match[4]?.trim(),
      });
    }
  }

  return refs;
}

function parseGlossary(nodes: TiptapNode[]): PRDDocument['sections']['glossary'] {
  const entries: PRDDocument['sections']['glossary'] = [];
  const items = extractListItems(nodes);

  for (const item of items) {
    // Match: **Term:** definition
    const match = item.match(/^(?:\*\*)?(.+?)(?:\*\*)?:\s*(.+)$/);
    if (match) {
      entries.push({
        term: match[1]!.trim(),
        definition: match[2]!.trim(),
      });
    }
  }

  return entries;
}

function parseChangelog(nodes: TiptapNode[]): PRDDocument['sections']['changelog'] {
  const entries: PRDDocument['sections']['changelog'] = [];
  const items = extractListItems(nodes);

  for (const item of items) {
    // Match: v1 (2026-04-01) by Author: Summary
    const match = item.match(/^v(\d+)\s*\((\d{4}-\d{2}-\d{2})\)\s*by\s+(.+?):\s*(.+)$/);

    if (match) {
      entries.push({
        version: parseInt(match[1]!, 10),
        date: match[2]!,
        author: match[3]!.trim(),
        summary: match[4]!.trim(),
      });
    }
  }

  return entries;
}
