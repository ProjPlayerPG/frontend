export type IgdbImageSize =
  | "t_thumb"
  | "t_cover_small"
  | "t_cover_big"
  | "t_720p"
  | "t_1080p";

export function normalizeCoverUrl(url?: string) {
  if (!url) return null
  // IGDB renvoie parfois //images.igdb.com/...
  return url.startsWith('//') ? `https:${url}` : url
}

export function normalizeBaseUrl(url?: string) {
  const value = url && url.trim() ? url.trim() : "http://localhost:3000"
  return value.endsWith("/") ? value.slice(0, -1) : value
}

export function igdbUrlWithSize(url?: string, size: IgdbImageSize = "t_cover_big") {
  if (!url) return null;

  // IGDB renvoie parfois des URLs qui commencent par //
  const full = url.startsWith("//") ? `https:${url}` : url;

  // Remplace le segment /t_xxx/ par la taille demandée
  return full.replace(/\/t_[^/]+\//, `/${size}/`);
}
