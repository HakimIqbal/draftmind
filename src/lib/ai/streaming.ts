export interface StreamProgressEvent {
  type: 'progress';
  step: number;
  label: string;
  percentage: number;
}

export interface StreamCompleteEvent {
  type: 'complete';
  prdId: string;
}

export interface StreamErrorEvent {
  type: 'error';
  message: string;
}

export type StreamEvent = StreamProgressEvent | StreamCompleteEvent | StreamErrorEvent;

export function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  function send(event: StreamEvent) {
    if (!controller) return;
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // stream closed
    }
  }

  function close() {
    if (!controller) return;
    try {
      controller.close();
    } catch {
      // already closed
    }
    controller = null;
  }

  return { stream, send, close };
}

export function sseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
