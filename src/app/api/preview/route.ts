export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "audio-ssl.itunes.apple.com",
  "audio.itunes.apple.com",
  "video-ssl.itunes.apple.com",
]);

function parseByteRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return null;

  const hasStart = match[1] !== "";
  const hasEnd = match[2] !== "";
  if (!hasStart && !hasEnd) return null;

  let start = hasStart ? Number(match[1]) : Number.NaN;
  let end = hasEnd ? Number(match[2]) : Number.NaN;

  if (!hasStart) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (!hasEnd) {
    end = size - 1;
  }

  end = Math.min(end, size - 1);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end) {
    return null;
  }
  return { start, end };
}

function audioContentType(value: string | null) {
  const type = (value ?? "").split(";")[0].trim().toLowerCase();
  if (type === "audio/mp4" || type === "audio/aac" || type === "audio/mpeg" || type === "audio/x-m4a") {
    return type === "audio/x-m4a" ? "audio/mp4" : type;
  }
  return "audio/mp4";
}

async function previewResponse(request: Request, includeBody: boolean) {
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
  if (!upstream.ok) {
    return new Response("Could not load preview", { status: 502 });
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  const total = body.byteLength;
  if (total === 0) {
    return new Response("Could not load preview", { status: 502 });
  }

  const contentType = audioContentType(upstream.headers.get("content-type"));
  const rangeHeader = request.headers.get("range");
  const common = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  };

  if (rangeHeader) {
    const range = parseByteRange(rangeHeader, total);
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: {
          ...common,
          "Content-Range": `bytes */${total}`,
        },
      });
    }

    const slice = body.subarray(range.start, range.end + 1);
    return new Response(includeBody ? slice : null, {
      status: 206,
      headers: {
        ...common,
        "Content-Length": String(slice.byteLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${total}`,
      },
    });
  }

  return new Response(includeBody ? body : null, {
    status: 200,
    headers: {
      ...common,
      "Content-Length": String(total),
    },
  });
}

export async function GET(request: Request) {
  return previewResponse(request, true);
}

export async function HEAD(request: Request) {
  return previewResponse(request, false);
}
