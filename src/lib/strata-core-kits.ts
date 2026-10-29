function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

export const CORE_KIT_MANUAL = "https://cdn.inmusicbrands.com/alesis/StrataCore/CORE%20Drum%20Module%20-%20User%20Guide%20-%20v1.2.0.pdf#page=59";


export type CorePreset = {
  number: number;
  name: string;
};

export type CoreArtistKit = {
  band: string;
  presets: CorePreset[];
};

export const CORE_ARTIST_KITS: CoreArtistKit[] = [
  { band: "Led Zeppelin", presets: [{ number: 54, name: "Billy Zeppelin" }] },
  { band: "Tool", presets: [{ number: 70, name: "Rosetta Thule" }] },
  { band: "Rage Against the Machine", presets: [{ number: 69, name: "Renegade Farm" }] },
  { band: "Audioslave", presets: [{ number: 69, name: "Renegade Farm" }] },
  {
    band: "Nirvana",
    presets: [
      { number: 8, name: "Big and Mean" },
      { number: 62, name: "Harder Rock" },
    ],
  },
  {
    band: "Foo Fighters",
    presets: [
      { number: 8, name: "Big and Mean" },
      { number: 62, name: "Harder Rock" },
    ],
  },
  {
    band: "Metallica",
    presets: [
      { number: 28, name: "Dark Power 1" },
      { number: 62, name: "Harder Rock" },
    ],
  },
  { band: "AC/DC", presets: [{ number: 21, name: "Son of Rock" }] },
  {
    band: "Red Hot Chili Peppers",
    presets: [
      { number: 11, name: "Tight Copper" },
      { number: 49, name: "Tight Steel" },
    ],
  },
  {
    band: "The Beatles",
    presets: [
      { number: 59, name: "Vintage Kit 1" },
      { number: 33, name: "Vintage Kit 2" },
    ],
  },
  {
    band: "Fleetwood Mac",
    presets: [
      { number: 32, name: "NY Maple Thud" },
      { number: 20, name: "Fat Kit" },
    ],
  },
  {
    band: "Eagles",
    presets: [
      { number: 32, name: "NY Maple Thud" },
      { number: 20, name: "Fat Kit" },
    ],
  },
  {
    band: "Dave Matthews Band",
    presets: [
      { number: 1, name: "NY Maple Kit" },
      { number: 7, name: "Cali Maple 2" },
    ],
  },
  {
    band: "Guns N' Roses",
    presets: [
      { number: 21, name: "Son of Rock" },
      { number: 54, name: "Billy Zeppelin" },
    ],
  },
  {
    band: "Alice in Chains",
    presets: [
      { number: 5, name: "Deep Dark Birch" },
      { number: 28, name: "Dark Power 1" },
    ],
  },
  {
    band: "Pearl Jam",
    presets: [
      { number: 21, name: "Son of Rock" },
      { number: 5, name: "Deep Dark Birch" },
    ],
  },
  {
    band: "Soundgarden",
    presets: [
      { number: 28, name: "Dark Power 1" },
      { number: 8, name: "Big and Mean" },
    ],
  },
  {
    band: "Stone Temple Pilots",
    presets: [
      { number: 20, name: "Fat Kit" },
      { number: 21, name: "Son of Rock" },
    ],
  },
  {
    band: "Smashing Pumpkins",
    presets: [
      { number: 14, name: "Artist Birch Proc 1" },
      { number: 62, name: "Harder Rock" },
    ],
  },
  {
    band: "Green Day",
    presets: [
      { number: 62, name: "Harder Rock" },
      { number: 26, name: "NY Maple Proc 1" },
    ],
  },
  {
    band: "Blink-182",
    presets: [
      { number: 49, name: "Tight Steel" },
      { number: 62, name: "Harder Rock" },
    ],
  },
  {
    band: "The Offspring",
    presets: [
      { number: 26, name: "NY Maple Proc 1" },
      { number: 62, name: "Harder Rock" },
    ],
  },
  {
    band: "Weezer",
    presets: [
      { number: 20, name: "Fat Kit" },
      { number: 1, name: "NY Maple Kit" },
    ],
  },
  {
    band: "Radiohead",
    presets: [
      { number: 13, name: "Tight Beech" },
      { number: 32, name: "NY Maple Thud" },
    ],
  },
  {
    band: "Coldplay",
    presets: [
      { number: 1, name: "NY Maple Kit" },
      { number: 44, name: "Dark Roomy Kit 1" },
    ],
  },
  {
    band: "U2",
    presets: [
      { number: 14, name: "Artist Birch Proc 1" },
      { number: 44, name: "Dark Roomy Kit 1" },
    ],
  },
  {
    band: "The Police",
    presets: [
      { number: 49, name: "Tight Steel" },
      { number: 13, name: "Tight Beech" },
    ],
  },
  {
    band: "Dire Straits",
    presets: [
      { number: 1, name: "NY Maple Kit" },
      { number: 13, name: "Tight Beech" },
    ],
  },
  {
    band: "Tom Petty and the Heartbreakers",
    presets: [
      { number: 32, name: "NY Maple Thud" },
      { number: 59, name: "Vintage Kit 1" },
    ],
  },
  {
    band: "The Rolling Stones",
    presets: [
      { number: 59, name: "Vintage Kit 1" },
      { number: 33, name: "Vintage Kit 2" },
    ],
  },
  {
    band: "Creedence Clearwater Revival",
    presets: [
      { number: 33, name: "Vintage Kit 2" },
      { number: 32, name: "NY Maple Thud" },
    ],
  },
  {
    band: "Aerosmith",
    presets: [
      { number: 21, name: "Son of Rock" },
      { number: 20, name: "Fat Kit" },
    ],
  },
  {
    band: "Van Halen",
    presets: [
      { number: 6, name: "Acrylic Raw 1" },
      { number: 8, name: "Big and Mean" },
    ],
  },
  {
    band: "Black Sabbath",
    presets: [
      { number: 54, name: "Billy Zeppelin" },
      { number: 59, name: "Vintage Kit 1" },
    ],
  },
  {
    band: "Iron Maiden",
    presets: [
      { number: 14, name: "Artist Birch Proc 1" },
      { number: 62, name: "Harder Rock" },
    ],
  },
];


export type CoreKitRecommendation = {
  presets: CorePreset[];
  match: "album" | "artist" | "fallback";
  label: string;
  reason: string;
};

const albumChoices = [
  { artist: "Nirvana", album: "Nevermind", number: 8, name: "Big and Mean", reason: "Try a big, punchy rock sound; reduce room level if the mix gets crowded." },
  { artist: "Nirvana", album: "In Utero", number: 5, name: "Deep Dark Birch", reason: "Try a darker acoustic starting point, then add room ambience to taste." },
  { artist: "Metallica", album: "Metallica", number: 28, name: "Dark Power 1", reason: "Start with a weighty rock sound and adjust the kick level against the recording." },
  { artist: "Metallica", album: "...And Justice for All", number: 14, name: "Artist Birch Proc 1", reason: "Try a processed birch sound with less ambience for a tighter starting point." },
  { artist: "Led Zeppelin", album: "Led Zeppelin IV", number: 54, name: "Billy Zeppelin", reason: "Start here for a large rock sound; vary room level from song to song." },
  { artist: "Pink Floyd", album: "The Dark Side of the Moon", number: 44, name: "Dark Roomy Kit 1", reason: "Try this roomy starting point and balance ambience against the backing track." },
  { artist: "The Beatles", album: "Abbey Road", number: 59, name: "Vintage Kit 1", reason: "Try a vintage starting point, keeping ambience restrained." },
  { artist: "Fleetwood Mac", album: "Rumours", number: 32, name: "NY Maple Thud", reason: "Start with a controlled maple sound and keep the kick and snare balanced with the song." },
];
const additionalArtists: CoreArtistKit[] = [
  { band: "Pink Floyd", presets: [{ number: 44, name: "Dark Roomy Kit 1" }] },
  { band: "Rush", presets: [{ number: 14, name: "Artist Birch Proc 1" }] },
  { band: "Queen", presets: [{ number: 6, name: "Acrylic Raw 1" }] },
  { band: "Genesis", presets: [{ number: 11, name: "Tight Copper" }] },
  { band: "Yes", presets: [{ number: 2, name: "Artist Birch Raw 1" }] },
  { band: "Steely Dan", presets: [{ number: 32, name: "NY Maple Thud" }] },
];
const kitsByName = new Map([...CORE_ARTIST_KITS, ...additionalArtists].map(kit => [normalizeTitle(kit.band), kit]));

export function getCoreKitRecommendation(artistName: string | null | undefined, albumTitle?: string | null): CoreKitRecommendation {
  const artist = normalizeTitle(artistName ?? "");
  const album = normalizeTitle(albumTitle ?? "").replace(/\s+(?:deluxe|remastered|remaster|anniversary|expanded)(?:\s.*)?$/, "");
  const albumChoice = albumChoices.find(choice => normalizeTitle(choice.artist) === artist && normalizeTitle(choice.album) === album);
  if (albumChoice) return {
    presets: [{ number: albumChoice.number, name: albumChoice.name }],
    match: "album", label: albumChoice.album, reason: albumChoice.reason,
  };
  const artistChoice = kitsByName.get(artist);
  if (artistChoice) return {
    presets: artistChoice.presets, match: "artist", label: artistChoice.band,
    reason: "Start with the first kit; try the alternate if it sits better with this recording.",
  };
  return {
    presets: [{ number: 1, name: "NY Maple Kit" }], match: "fallback", label: "General starting point",
    reason: "No artist or album match yet. Start with this acoustic kit and adjust to the recording.",
  };
}
