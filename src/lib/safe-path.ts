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
  const origin = request.headers.get("origin");
  if (origin && URL.canParse(origin)) return origin;
  return new URL(request.url).origin;
}

export function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "http://tabshelf.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}
