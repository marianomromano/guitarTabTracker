export type YoutubeVideo = {
  videoId: string;
  title: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickVideo(hits: YoutubeVideo[], artist: string, title: string) {
  const wanted = `${normalize(artist)} ${normalize(title)}`;
  const official = hits.find((hit) => /official (audio|video|lyric)/i.test(hit.title));
  const topic = hits.find((hit) => /topic/i.test(hit.title) && normalize(hit.title).includes(normalize(title)));
  const close = hits.find((hit) => {
    const text = normalize(hit.title);
    return text.includes(normalize(title)) && (text.includes(normalize(artist)) || wanted.includes(text));
  });
  return official ?? topic ?? close ?? hits[0] ?? null;
}

export function youtubeEmbedUrl(videoId: string, autoplay = false) {
  const url = new URL(`https://www.youtube.com/embed/${videoId}`);
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("enablejsapi", "1");
  if (autoplay) url.searchParams.set("autoplay", "1");
  return url.toString();
}

export async function searchYoutubeVideo(artist: string, title: string) {
  const query = `${artist} ${title} official audio`;
  const fromYoutube = await searchYoutubeHtml(query);
  const picked = pickVideo(fromYoutube, artist, title);
  if (picked) return picked;

  const fromInvidious = await searchInvidious(query);
  return pickVideo(fromInvidious, artist, title);
}

async function searchYoutubeHtml(query: string): Promise<YoutubeVideo[]> {
  try {
    const url = new URL("https://www.youtube.com/results");
    url.searchParams.set("search_query", query);
    url.searchParams.set("sp", "EgIQAQ%3D%3D");
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const ids = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((match) => match[1]);
    const unique = [...new Set(ids)].slice(0, 8);
    return unique.map((videoId) => ({ videoId, title: query }));
  } catch {
    return [];
  }
}

async function searchInvidious(query: string): Promise<YoutubeVideo[]> {
  const hosts = ["https://inv.nadeko.net", "https://yewtu.be", "https://invidious.nerdvpn.de"];
  for (const host of hosts) {
    try {
      const url = new URL("/api/v1/search", host);
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (!response.ok) continue;
      const data = (await response.json()) as { videoId?: string; title?: string }[];
      if (!Array.isArray(data)) continue;
      return data
        .filter((item) => item.videoId && item.title)
        .slice(0, 8)
        .map((item) => ({ videoId: item.videoId as string, title: item.title as string }));
    } catch {
      // Try the next public instance.
    }
  }
  return [];
}
