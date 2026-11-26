import { YouTubeVideo } from '../types/lms';

export const YOUTUBE_CHANNEL_ID = 'UC3uDpLU_Nvv-udo0w1Czlxw';
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@tanvirssciencesquare';
export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/tanvirssciencesquare/';
export const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

const RSS2JSON_ENDPOINT = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
  YOUTUBE_RSS_URL
)}`;

export interface YouTubeSyncResult {
  videos: YouTubeVideo[];
  source: 'youtube-api' | 'rss' | 'cached';
}

export interface YouTubeImportMetadata {
  title: string;
  authorName: string;
  thumbnailUrl: string;
  embedUrl: string;
  watchUrl: string;
  videoId: string | null;
  playlistId: string | null;
}

/**
 * Extracts an 11-character YouTube video ID from standard watch, share, shorts, live, or embed URLs.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      const vParam = url.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }

      const parts = url.pathname.split('/').filter(Boolean);
      const markerIdx = parts.findIndex((p) =>
        ['embed', 'shorts', 'live', 'v'].includes(p)
      );
      if (markerIdx !== -1 && parts[markerIdx + 1]) {
        const candidate = parts[markerIdx + 1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
      }
    }
  } catch {
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  return null;
}

/**
 * Extracts a YouTube playlist ID from `list=` query parameters.
 */
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get('list');
    return listParam && listParam.length >= 10 ? listParam : null;
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
}

export function isYouTubeUrl(input: string): boolean {
  return Boolean(extractYouTubeId(input) || extractPlaylistId(input));
}

export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'maxres' | 'hq' = 'hq'
): string {
  const filename = quality === 'maxres' ? 'maxresdefault.jpg' : 'hqdefault.jpg';
  return `https://i.ytimg.com/vi/${videoId}/${filename}`;
}

export function getYouTubeEmbedUrl(
  urlOrId: string,
  options: { autoplay?: boolean } = {}
): string | null {
  const videoId = extractYouTubeId(urlOrId);
  const playlistId = extractPlaylistId(urlOrId);
  const autoplayFlag = options.autoplay ? '1' : '0';
  const commonParams = `rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&fs=1&autoplay=${autoplayFlag}`;

  if (videoId && playlistId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?list=${encodeURIComponent(
      playlistId
    )}&${commonParams}`;
  }
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?${commonParams}`;
  }
  if (playlistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(
      playlistId
    )}&${commonParams}`;
  }
  return null;
}

export function getYouTubeWatchUrl(urlOrId: string): string | null {
  const videoId = extractYouTubeId(urlOrId);
  const playlistId = extractPlaylistId(urlOrId);
  if (videoId && playlistId) {
    return `https://www.youtube.com/watch?v=${videoId}&list=${encodeURIComponent(playlistId)}`;
  }
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (playlistId) {
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
  }
  return null;
}

/**
 * Curated fallback classes reflecting Tanvir's Science Square focus when live RSS/API cannot be reached.
 */
const FALLBACK_CHANNEL_CLASSES: YouTubeVideo[] = [
  {
    id: 'tss_fallback_env_chem',
    title: 'HSC Chemistry 2nd Paper: পরিবেশ রসায়ন (Environmental Chemistry) One-Shot',
    publishedAt: '2026-11-10',
    thumbnailUrl: '/src/assets/images/science_chemistry_lab_1795187239908.jpg',
    watchUrl: `${YOUTUBE_CHANNEL_URL}/videos`,
    embedUrl: '',
    description: 'Complete board + admission CQ & MCQ breakdown with gas laws, BOD/COD, and acid-base theory.',
  },
  {
    id: 'tss_fallback_physics_vectors',
    title: 'HSC Physics 1st Paper: ভেক্টর ও গতিবিদ্যা (Vectors & Kinematics) Masterclass',
    publishedAt: '2026-11-04',
    thumbnailUrl: '/src/assets/images/science_physics_optics_1795187241108.jpg',
    watchUrl: `${YOUTUBE_CHANNEL_URL}/videos`,
    embedUrl: '',
    description: 'River-boat problems, projectile shortcuts, and calculus-based kinematics for HSC & BUET.',
  },
  {
    id: 'tss_fallback_math_calculus',
    title: 'HSC Higher Math: অন্তরীকরণ ও যোগজীকরণ (Calculus One-Shot Revision)',
    publishedAt: '2026-10-28',
    thumbnailUrl: '/src/assets/images/science_higher_math_1795187241385.jpg',
    watchUrl: `${YOUTUBE_CHANNEL_URL}/videos`,
    embedUrl: '',
    description: 'Limits, L-Hospital rules, maxima-minima, and definite integral area tricks.',
  },
];

interface Rss2JsonItem {
  title?: string;
  pubDate?: string;
  link?: string;
  guid?: string;
  thumbnail?: string;
  description?: string;
}

interface Rss2JsonResponse {
  status?: string;
  items?: Rss2JsonItem[];
}

interface YouTubeApiSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    publishedAt?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
    };
  };
}

/**
 * Fetches latest real videos from Tanvir's Science Square via:
 * 1) YouTube Data API v3 (if VITE_YOUTUBE_API_KEY is configured)
 * 2) YouTube Public RSS feed via CORS-safe rss2json proxy
 * 3) Curated offline fallback when sandbox network/CORS blocks external requests
 */
export async function fetchChannelVideos(maxResults = 6): Promise<YouTubeSyncResult> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${encodeURIComponent(
        apiKey.trim()
      )}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = (await res.json()) as { items?: YouTubeApiSearchItem[] };
        const videos: YouTubeVideo[] = (data.items ?? [])
          .map((item): YouTubeVideo | null => {
            const vid = item.id?.videoId;
            if (!vid) return null;
            return {
              id: vid,
              title: item.snippet?.title ?? 'Tanvir’s Science Square Class',
              publishedAt: (item.snippet?.publishedAt ?? '').slice(0, 10),
              thumbnailUrl:
                item.snippet?.thumbnails?.high?.url ??
                getYouTubeThumbnailUrl(vid, 'hq'),
              watchUrl: `https://www.youtube.com/watch?v=${vid}`,
              embedUrl: getYouTubeEmbedUrl(vid) ?? '',
              description: item.snippet?.description ?? '',
            };
          })
          .filter((v): v is YouTubeVideo => v !== null);

        if (videos.length > 0) {
          return { videos, source: 'youtube-api' };
        }
      }
    } catch {
      // Fall through to RSS proxy
    }
  }

  try {
    const res = await fetch(RSS2JSON_ENDPOINT);
    if (res.ok) {
      const data = (await res.json()) as Rss2JsonResponse;
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        const videos: YouTubeVideo[] = data.items
          .slice(0, maxResults)
          .map((item): YouTubeVideo | null => {
            const rawLink = item.link || '';
            const extractedId =
              extractYouTubeId(rawLink) ??
              (item.guid?.startsWith('yt:video:') ? item.guid.replace('yt:video:', '') : null);
            if (!extractedId) return null;

            return {
              id: extractedId,
              title: item.title ?? 'Science Class — Tanvir’s Science Square',
              publishedAt: (item.pubDate ?? '').slice(0, 10),
              thumbnailUrl: item.thumbnail || getYouTubeThumbnailUrl(extractedId, 'hq'),
              watchUrl: `https://www.youtube.com/watch?v=${extractedId}`,
              embedUrl: getYouTubeEmbedUrl(extractedId) ?? '',
              description: item.description
                ? item.description.replace(/<[^>]+>/g, '').slice(0, 140)
                : '',
            };
          })
          .filter((v): v is YouTubeVideo => v !== null);

        if (videos.length > 0) {
          return { videos, source: 'rss' };
        }
      }
    }
  } catch {
    // Fall through to curated fallback
  }

  return {
    videos: FALLBACK_CHANNEL_CLASSES,
    source: 'cached',
  };
}

/**
 * Resolves metadata (Title, Thumbnail, Embed URL) from any pasted YouTube Video or Playlist link
 * using YouTube oEmbed / Noembed without requiring an API key.
 */
export async function fetchYouTubeMetadataByUrl(
  rawUrl: string
): Promise<YouTubeImportMetadata> {
  const trimmed = rawUrl.trim();
  const videoId = extractYouTubeId(trimmed);
  const playlistId = extractPlaylistId(trimmed);

  if (!videoId && !playlistId) {
    throw new Error('Paste a valid YouTube video or playlist URL from @tanvirssciencesquare.');
  }

  const canonicalWatchUrl = getYouTubeWatchUrl(trimmed) ?? trimmed;
  const embedUrl = getYouTubeEmbedUrl(trimmed) ?? '';
  let title = playlistId && !videoId
    ? "Tanvir's Science Square Playlist Course"
    : "Tanvir's Science Square Video Lecture";
  let authorName = "Tanvir's Science Square";
  let thumbnailUrl = videoId
    ? getYouTubeThumbnailUrl(videoId, 'hq')
    : '/src/assets/images/science_chemistry_lab_1795187239908.jpg';

  const oembedTargets = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalWatchUrl)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(canonicalWatchUrl)}`,
  ];

  for (const endpoint of oembedTargets) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      if (data.title) {
        title = data.title;
        if (data.author_name) authorName = data.author_name;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
        break;
      }
    } catch {
      // Try next oEmbed provider
    }
  }

  return {
    title,
    authorName,
    thumbnailUrl,
    embedUrl,
    watchUrl: canonicalWatchUrl,
    videoId,
    playlistId,
  };
}
