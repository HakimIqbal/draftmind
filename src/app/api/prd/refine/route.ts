export async function POST(request: Request) {
  const { prdId, sectionKey, instruction } = await request.json();

  if (!prdId || !sectionKey || !instruction) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Mock refine for Phase 3 — real AI call later
  const refined = `[Refined based on: "${instruction}"]\n\nThe ${sectionKey} section has been updated to incorporate the requested changes. Key improvements include more specific metrics, clearer acceptance criteria, and better alignment with project objectives.`;

  return Response.json({
    original: '[Current section content]',
    refined,
    changes: 1,
  });
}
