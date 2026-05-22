const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

type GetPublicOriginInput = {
  nextUrlOrigin: string;
  headers: Headers;
  envAppUrl?: string;
};

function normalizeOrigin(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function getPublicOrigin({ nextUrlOrigin, headers, envAppUrl }: GetPublicOriginInput): string {
  const envOrigin = normalizeOrigin(envAppUrl);
  if (envOrigin) return envOrigin;

  const forwardedHost = headers.get("x-forwarded-host") ?? headers.get("host");
  const forwardedProto = headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    const firstHost = forwardedHost.split(",")[0]?.trim();
    const hostname = firstHost?.split(":")[0];
    if (firstHost && hostname && !LOCAL_HOSTS.has(hostname)) {
      return `${forwardedProto}://${firstHost}`;
    }
  }

  const normalizedNextOrigin = normalizeOrigin(nextUrlOrigin);
  if (normalizedNextOrigin && !isLocalOrigin(normalizedNextOrigin)) {
    return normalizedNextOrigin;
  }

  return envOrigin ?? normalizedNextOrigin ?? nextUrlOrigin;
}
