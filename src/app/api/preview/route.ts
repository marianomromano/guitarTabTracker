export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "audio-ssl.itunes.apple.com",
  "audio.itunes.apple.com",
  "video-ssl.itunes.apple.com",
]);

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  let preview: URL;
  try {
    preview = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (preview.protocol !== "https:" || !ALLOWED_HOSTS.has(preview.hostname)) {
    return new Response("Unsupported audio host", { status: 400 });
  }

  const upstream = await fetch(preview, {
    headers: { Accept: "audio/*,*/*" },
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Could not load preview", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mp4",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
