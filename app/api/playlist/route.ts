// app/api/playlist/route.ts

import { NextResponse } from "next/server";
import { gqlFetch } from "@/lib/graphql";

const GRAPHQL_QUERY = `
  query Playlist {
    btcPlaylist {
      title
      audioUrl
    }
  }
`;

const WP_BASE_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://btc.858webdesign.com";
const FALLBACK_ENDPOINT =
  process.env.BTC_PLAYLIST_FALLBACK_URL ??
  "https://backend.petereichhorst.com/wp-json/audio/v1/list?sort=mtime_desc";

const FALLBACK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
};

export type PlaylistTrack = {
  url: string;
  title: string | null;
};

const AUDIO_EXT_RE = /\.(mp3|m4a|ogg|wav|flac)$/i;

const normalizeUrl = (url?: string | null): string => {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed, WP_BASE_URL).href.replace("http://", "https://");
  } catch {
    return trimmed;
  }
};

// PRIMARY: Real titles from btcPlaylist (GraphQL)
async function getGraphqlTracks(): Promise<PlaylistTrack[]> {
  try {
    const data = await gqlFetch(GRAPHQL_QUERY);

    if (!Array.isArray(data?.btcPlaylist)) {
      console.warn("btcPlaylist returned no data or wrong shape");
      return [];
    }

    const tracks = data.btcPlaylist
      .filter(
        (track: any): track is { audioUrl: string; title?: string | null } =>
          !!track?.audioUrl && typeof track.audioUrl === "string"
      )
      .map((track: { audioUrl: string; title?: string | null }) => ({
        url: normalizeUrl(track.audioUrl),
        title: typeof track.title === "string" ? track.title.trim() || null : null,
      }));

    console.log(`Loaded ${tracks.length} tracks from btcPlaylist (GraphQL)`);
    return tracks;
  } catch (error) {
    console.error("GraphQL btcPlaylist fetch failed — falling back", error);
    return [];
  }
}

// FALLBACK 1: External JSON endpoint
async function getFallbackTracks(): Promise<PlaylistTrack[]> {
  try {
    const res = await fetch(FALLBACK_ENDPOINT, { cache: "no-store", headers: FALLBACK_HEADERS });
    if (!res.ok) throw new Error(`Fallback request failed: ${res.status}`);
    const data = await res.json();

    const tracks = (Array.isArray(data) ? data : [])
      .map((item: any) => {
        const url = normalizeUrl(item?.url);
        if (!url) return null;
        const rawTitle = typeof item?.name === "string" ? item.name.trim() : "";
        const cleanedTitle = rawTitle ? rawTitle.replace(/\.[^.]+$/, "") : null;
        return { url, title: cleanedTitle };
      })
      .filter((t): t is PlaylistTrack => t !== null)
      .reverse();

    console.log(`Loaded ${tracks.length} tracks from fallback endpoint`);
    return tracks;
  } catch (error) {
    console.error("Fallback endpoint failed", error);
    return [];
  }
}

// Title enrichment helpers
function extractAudioUrl(value: unknown, depth = 0): string | null {
  if (!value || depth > 4) return null;
  if (typeof value === "string" && AUDIO_EXT_RE.test(value)) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractAudioUrl(entry, depth + 1);
      if (found) return found;
    }
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === "string" && AUDIO_EXT_RE.test(obj.url)) return obj.url;
    for (const entry of Object.values(obj)) {
      const found = extractAudioUrl(entry, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function fetchTrackTitleMap(): Promise<Map<string, string>> {
  try {
    const endpoint = `${WP_BASE_URL.replace(/\/$/, "")}/wp-json/wp/v2/tracks?per_page=100&_fields=title.rendered,acf,meta`;
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) throw new Error(`Track CPT request failed: ${res.status}`);
    const data = await res.json();
    const map = new Map<string, string>();

    (Array.isArray(data) ? data : []).forEach((track: any) => {
      const url = extractAudioUrl(track?.acf) || extractAudioUrl(track?.meta);
      const title = typeof track?.title?.rendered === "string" ? track.title.rendered.trim() : null;
      if (url && title) map.set(normalizeUrl(url), title);
    });
    return map;
  } catch (error) {
    console.error("Failed to fetch track CPT titles", error);
    return new Map();
  }
}

async function fetchMediaTitleMap(): Promise<Map<string, string>> {
  try {
    const endpoint = `${WP_BASE_URL.replace(/\/$/, "")}/wp-json/wp/v2/media?media_type=audio&per_page=100&_fields=source_url,title.rendered`;
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) throw new Error(`Media titles request failed: ${res.status}`);
    const data = await res.json();
    const map = new Map<string, string>();

    (Array.isArray(data) ? data : []).forEach((item: any) => {
      const url = normalizeUrl(item?.source_url);
      const title = typeof item?.title?.rendered === "string" ? item.title.rendered.trim() : null;
      if (url && title) map.set(url, title);
    });
    return map;
  } catch (error) {
    console.error("Failed to fetch media titles", error);
    return new Map();
  }
}

// Apply title maps correctly — fully typed
const applyTitleMap = (tracks: PlaylistTrack[], maps: Map<string, string>[]): PlaylistTrack[] =>
  tracks.map((track) => {
    const normalized = normalizeUrl(track.url);
    const foundTitle =
      track.title ||
      maps.reduce<string | null>(
        (found, map) => found ?? map.get(normalized) ?? null,
        null
      );
    return {
      ...track,
      title: foundTitle ?? null,
    };
  });

export async function GET() {
  let tracks = await getGraphqlTracks();
  let source: "graphql" | "fallback" | "enriched" = "graphql";

  if (!tracks.length) {
    tracks = await getFallbackTracks();
    source = "fallback";
  }

  if (tracks.length > 0) {
    const [trackTitleMap, mediaTitleMap] = await Promise.all([
      fetchTrackTitleMap(),
      fetchMediaTitleMap(),
    ]);
    tracks = applyTitleMap(tracks, [trackTitleMap, mediaTitleMap]);
    if (source === "fallback") source = "enriched";
  }

  return NextResponse.json({ tracks, source });
}
