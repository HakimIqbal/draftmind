import { PROVIDER_REGISTRY } from '@/lib/ai/providers';

export async function POST(request: Request) {
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
