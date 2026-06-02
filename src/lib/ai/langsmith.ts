import 'server-only';
import { Client } from 'langsmith';
import { RunTree } from 'langsmith';

// LangSmith client — only initialized if API key is set
const apiKey = process.env.LANGCHAIN_API_KEY;
const project = process.env.LANGCHAIN_PROJECT ?? 'draftmind';
const enabled = !!apiKey && process.env.LANGCHAIN_TRACING_V2 === 'true';

let client: Client | null = null;

export function getLangSmithClient(): Client | null {
  if (!enabled) return null;
  if (!client) {
    client = new Client({ apiKey, apiUrl: 'https://api.smith.langchain.com' });
  }
  return client;
}

export function isLangSmithEnabled(): boolean {
  return enabled;
}

export function getLangSmithProject(): string {
  return project;
}

/**
 * Create a traced run for an AI operation.
 * Wraps the operation with LangSmith tracing — logs prompt, response, tokens, latency.
 * Falls back silently if LangSmith is not configured.
 */
export async function tracedAICall<T>({
  name,
  runType = 'llm',
  inputs,
  metadata,
  fn,
}: {
  name: string;
  runType?: 'llm' | 'chain' | 'tool';
  inputs: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  fn: () => Promise<T>;
}): Promise<T> {
  if (!enabled) return fn();

  const run = new RunTree({
    name,
    run_type: runType,
    inputs,
    project_name: project,
    extra: metadata ? { metadata } : undefined,
  });

  try {
    await run.postRun();
    const result = await fn();

    // Extract token/latency info if available
    const output =
      typeof result === 'object' && result !== null
        ? (result as Record<string, unknown>)
        : { result };
    await run.end({ outputs: output });
    await run.patchRun();

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      await run.end({ error: message });
      await run.patchRun();
    } catch (_traceError) {
      // LangSmith is optional — never pollute admin dashboard with trace failures.
      // The error is a best-effort notification, not a system problem.
      // (Intentionally no systemLog call here.)
    }
    throw error;
  }
}

/**
 * Log a completed AI run to LangSmith (fire-and-forget).
 * Use this for logging after the fact rather than wrapping.
 */
export async function logToLangSmith({
  name,
  inputs,
  outputs,
  error,
  startTime,
  endTime,
  metadata,
  usage,
}: {
  name: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  startTime: Date;
  endTime: Date;
  metadata?: Record<string, unknown>;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}): Promise<void> {
  if (!enabled) return;

  try {
    const run = new RunTree({
      name,
      run_type: 'llm',
      inputs,
      project_name: project,
      start_time: startTime.getTime(),
      extra: {
        ...(metadata ? { metadata } : {}),
        ...(usage
          ? {
              usage_metadata: {
                input_tokens: usage.promptTokens ?? 0,
                output_tokens: usage.completionTokens ?? 0,
                total_tokens: usage.totalTokens ?? 0,
              },
            }
          : {}),
      },
    });

    await run.postRun();

    if (error) {
      await run.end({ error, end_time: endTime.getTime() });
    } else {
      await run.end({ outputs: outputs ?? {}, end_time: endTime.getTime() });
    }

    await run.patchRun();
  } catch (error) {
    // LangSmith is optional — trace failures should never appear in admin dashboard.
    // Surface only in server console, not as a system log entry.
    console.warn('[langsmith] trace failed:', error instanceof Error ? error.message : String(error));
  }
}

// In-memory cache for LangSmith runs (10-minute TTL)
let _lsCache: { data: LangSmithResult; ts: number } | null = null;
const LS_CACHE_TTL = 600_000; // 10 minutes

interface LangSmithRun {
  id: string;
  name: string;
  run_type: string;
  status: string;
  start_time: string;
  end_time: string | null;
  latency_ms: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_cost: number | null;
  error: string | null;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

interface LangSmithResult {
  runs: LangSmithRun[];
  summary: {
    total_runs: number;
    success_count: number;
    error_count: number;
    avg_latency_ms: number;
    total_cost: number;
    total_tokens: number;
  };
}

const EMPTY_RESULT: LangSmithResult = {
  runs: [],
  summary: {
    total_runs: 0,
    success_count: 0,
    error_count: 0,
    avg_latency_ms: 0,
    total_cost: 0,
    total_tokens: 0,
  },
};

/**
 * Fetch recent runs from LangSmith API for admin dashboard.
 * Uses direct HTTP fetch (faster than langsmith JS library's async iterator)
 * with 10-minute in-memory cache.
 */
export async function fetchLangSmithRuns(limit: number = 20): Promise<LangSmithResult> {
  if (!enabled || !apiKey) return EMPTY_RESULT;

  // Return cached data if still fresh
  if (_lsCache && Date.now() - _lsCache.ts < LS_CACHE_TTL) {
    return _lsCache.data;
  }

  try {
    // First get project/session ID
    const sessRes = await fetch(
      `https://api.smith.langchain.com/api/v1/sessions?name=${encodeURIComponent(project)}&limit=1`,
      {
        headers: { 'x-api-key': apiKey },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!sessRes.ok) return EMPTY_RESULT;
    const sessions = await sessRes.json();
    const sessionId = sessions?.[0]?.id;
    if (!sessionId) return EMPTY_RESULT;

    // Fetch runs via direct POST (single HTTP call, no iterator)
    const runsRes = await fetch('https://api.smith.langchain.com/api/v1/runs/query', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: [sessionId], limit }),
      signal: AbortSignal.timeout(5000),
    });
    if (!runsRes.ok) return EMPTY_RESULT;
    const data = await runsRes.json();
    const rawRuns = data.runs ?? [];

    const runs: LangSmithRun[] = rawRuns.map((run: Record<string, unknown>) => {
      const startMs = run.start_time ? new Date(run.start_time as string).getTime() : 0;
      const endMs = run.end_time ? new Date(run.end_time as string).getTime() : 0;
      return {
        id: run.id as string,
        name: run.name as string,
        run_type: run.run_type as string,
        status: (run.status as string) ?? (run.error ? 'error' : 'success'),
        start_time: run.start_time ? new Date(run.start_time as string).toISOString() : '',
        end_time: run.end_time ? new Date(run.end_time as string).toISOString() : null,
        latency_ms: endMs && startMs ? endMs - startMs : null,
        total_tokens: (run.total_tokens as number) ?? null,
        prompt_tokens: (run.prompt_tokens as number) ?? null,
        completion_tokens: (run.completion_tokens as number) ?? null,
        total_cost: (run.total_cost as number) ?? null,
        error: (run.error as string) ?? null,
        inputs: (run.inputs as Record<string, unknown>) ?? {},
        outputs: (run.outputs as Record<string, unknown>) ?? null,
        metadata:
          ((run.extra as Record<string, unknown>)?.metadata as Record<string, unknown>) ?? null,
      };
    });

    const successRuns = runs.filter((r) => r.status !== 'error');
    const totalLatency = runs.reduce((sum, r) => sum + (r.latency_ms ?? 0), 0);
    const totalCost = runs.reduce((sum, r) => sum + (r.total_cost ?? 0), 0);
    const totalTokens = runs.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);

    const result: LangSmithResult = {
      runs,
      summary: {
        total_runs: runs.length,
        success_count: successRuns.length,
        error_count: runs.length - successRuns.length,
        avg_latency_ms: runs.length > 0 ? Math.round(totalLatency / runs.length) : 0,
        total_cost: Math.round(totalCost * 10000) / 10000,
        total_tokens: totalTokens,
      },
    };

    _lsCache = { data: result, ts: Date.now() };
    return result;
  } catch (error) {
    // LangSmith is optional — log fetch failures only to server console.
    console.warn('[langsmith] fetch_runs failed:', error instanceof Error ? error.message : String(error));
    return EMPTY_RESULT;
  }
}
