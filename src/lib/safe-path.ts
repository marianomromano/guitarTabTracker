export function safeReturnPath(value: string | null | undefined, fallback = "/search") {
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.pathname.startsWith("/") && !url.pathname.startsWith("//")) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // ignore invalid URLs
  }
  return fallback;
}

export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  // Next's internal URL may use localhost even when the browser uses 127.0.0.1.
  // The HTTP Host header identifies the origin the browser actually requested.
  if (host) {
    try {
      const external = new URL(`${url.protocol}//${host}`);
      if (external.host === host.toLowerCase() && !external.username && !external.password) {
        return external.origin;
      }
    } catch {
      // Fall back to the framework URL if Host is malformed.
    }
  }
  return url.origin;
}

export function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "http://tabshelf.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === requestOrigin(request);
}
