import { PROVIDER_REGISTRY } from '@/lib/ai/providers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Admin only
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_super_admin)
    return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { type, apiKey, baseUrl } = body as {
    type: string;
    apiKey: string;
    baseUrl?: string;
  };

  if (!type || !apiKey) {
    return Response.json({ ok: false, message: 'Missing type or apiKey' }, { status: 400 });
  }

  const config = PROVIDER_REGISTRY[type];
  if (!config) {
    return Response.json({ ok: false, message: `Unknown provider type: ${type}` }, { status: 400 });
  }

  const start = Date.now();

  try {
    const model = config.createModel(apiKey, config.defaultModel, baseUrl);

    // Try a minimal call to validate the API key
    const { generateText } = await import('ai');
    const result = await generateText({
      model,
      prompt: 'Respond with exactly: pong',
      maxTokens: 10,
    });

    const latency = Date.now() - start;

    return Response.json({
      ok: true,
      model: config.defaultModel,
      message: `Connection successful. Response: "${result.text.trim()}"`,
      latency_ms: latency,
    });
  } catch (error) {
    const latency = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return Response.json({
      ok: false,
      model: config.defaultModel,
      message: `Connection failed: ${message}`,
      latency_ms: latency,
    });
  }
}
