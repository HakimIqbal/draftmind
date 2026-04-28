import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prdId } = await request.json();
  if (!prdId) return NextResponse.json({ error: 'Missing prdId' }, { status: 400 });

  // Mock: generate sample findings
  const mockFindings = [
    {
      severity: 'high',
      section_key: 'success_metrics',
      title: 'Missing baseline values',
      description: 'Success metrics lack baseline measurements',
      suggested_fix: 'Add current baseline values for each metric',
    },
    {
      severity: 'medium',
      section_key: 'user_stories',
      title: 'Weak acceptance criteria',
      description: 'User stories have vague acceptance criteria',
      suggested_fix: 'Add specific, measurable acceptance criteria',
    },
    {
      severity: 'low',
      section_key: 'glossary',
      title: 'Missing glossary entries',
      description: 'Technical terms used without definitions',
      suggested_fix: 'Add definitions for domain-specific terms',
    },
  ];

  return NextResponse.json({ findings: mockFindings, health_score: 72 });
}
