import React, { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  ShieldCheck,
} from 'lucide-react';
import {
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  isYouTubeUrl,
} from '../services/youtubeSync';

interface SecureVideoPlayerProps {
  videoUrl: string;
  title: string;
  posterUrl?: string;
  autoplay?: boolean;
  theaterMode?: boolean;
  allowExternalLink?: boolean;
  onToggleTheater?: () => void;
}

type VideoProvider = 'youtube' | 'bunny' | 'vimeo' | 'direct' | 'unsupported';

interface ResolvedVideoSource {
  provider: VideoProvider;
  embedUrl: string | null;
  directUrl: string | null;
  externalUrl: string | null;
  label: string;
}

function isSafeHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function resolveBunnyEmbed(parsed: URL, autoplay: boolean): string | null {
  const host = parsed.hostname.toLowerCase();
  if (host !== 'iframe.mediadelivery.net' && host !== 'player.mediadelivery.net') {
    return null;
  }
  const normalizedPath = parsed.pathname.replace(/^\/play\//, '/embed/');
  const target = new URL(`https://iframe.mediadelivery.net${normalizedPath}`);
  parsed.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  target.searchParams.set('autoplay', autoplay ? 'true' : 'false');
  target.searchParams.set('preload', 'true');
  target.searchParams.set('responsive', 'true');
  return target.toString();
}

function resolveVimeoEmbed(parsed: URL, autoplay: boolean): string | null {
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') {
    return null;
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  let videoId: string | null = null;
  let unlistedHash: string | null = parsed.searchParams.get('h');

  if (host === 'player.vimeo.com') {
    const idx = parts.indexOf('video');
    if (idx !== -1 && parts[idx + 1] && /^\d+$/.test(parts[idx + 1])) {
      videoId = parts[idx + 1];
    }
  } else {
    // Supports public vimeo.com/{id} and unlisted vimeo.com/{id}/{hash}
    const numericIdx = parts.findIndex((p) => /^\d+$/.test(p));
    if (numericIdx !== -1) {
      videoId = parts[numericIdx];
      if (!unlistedHash && parts[numericIdx + 1] && /^[a-zA-Z0-9]+$/.test(parts[numericIdx + 1])) {
        unlistedHash = parts[numericIdx + 1];
      }
    }
  }

  if (!videoId) return null;

  const target = new URL(`https://player.vimeo.com/video/${videoId}`);
  if (unlistedHash) {
    target.searchParams.set('h', unlistedHash);
  }
  target.searchParams.set('autoplay', autoplay ? '1' : '0');
  target.searchParams.set('dnt', '1');
  target.searchParams.set('title', '0');
  target.searchParams.set('byline', '0');
  target.searchParams.set('portrait', '0');
  target.searchParams.set('pip', '0');
  return target.toString();
}

function resolveVideoSource(
  videoUrl: string,
  autoplay: boolean
): ResolvedVideoSource {
  const trimmed = videoUrl.trim();
  if (!trimmed) {
    return {
      provider: 'unsupported',
      embedUrl: null,
      directUrl: null,
      externalUrl: null,
      label: 'VIDEO STREAM',
    };
  }

  if (isYouTubeUrl(trimmed)) {
    const ytEmbed = getYouTubeEmbedUrl(trimmed, { autoplay });
    if (ytEmbed) {
      return {
        provider: 'youtube',
        embedUrl: ytEmbed,
        directUrl: null,
        externalUrl: getYouTubeWatchUrl(trimmed),
        label: 'PROTECTED YOUTUBE STREAM',
      };
    }
  }

  const parsed = isSafeHttpUrl(trimmed);
  if (!parsed) {
    return {
      provider: 'unsupported',
      embedUrl: null,
      directUrl: null,
      externalUrl: null,
      label: 'VIDEO STREAM',
    };
  }

  const bunnyUrl = resolveBunnyEmbed(parsed, autoplay);
  if (bunnyUrl) {
    return {
      provider: 'bunny',
      embedUrl: bunnyUrl,
      directUrl: null,
      externalUrl: null,
      label: 'BUNNY STREAM CDN',
    };
  }

  const vimeoUrl = resolveVimeoEmbed(parsed, autoplay);
  if (vimeoUrl) {
    return {
      provider: 'vimeo',
      embedUrl: vimeoUrl,
      directUrl: null,
      externalUrl: null,
      label: 'VIMEO STREAM',
    };
  }

  return {
    provider: 'direct',
    embedUrl: null,
    directUrl: parsed.toString(),
    externalUrl: null,
    label: 'CLASS VIDEO',
  };
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  videoUrl,
  title,
  posterUrl,
  autoplay = false,
  theaterMode = false,
  allowExternalLink = false,
  onToggleTheater,
}) => {
  const [streamReady, setStreamReady] = useState(false);

  const source = useMemo(
    () => resolveVideoSource(videoUrl, autoplay),
    [videoUrl, autoplay]
  );

  useEffect(() => {
    setStreamReady(false);
  }, [source.embedUrl, source.directUrl]);

  const blockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="w-full bg-[#030805] select-none"
      onContextMenu={blockContextMenu}
    >
      {/* 16:9 Distraction-Free Protected Video Viewport */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-[#030805]"
        onContextMenu={blockContextMenu}
      >
        {source.embedUrl ? (
          <>
            {!streamReady && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#030805] text-slate-300">
                {posterUrl && (
                  <img
                    src={posterUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover opacity-25"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Play className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Loading class stream...</span>
                  </span>
                </div>
              </div>
            )}

            <iframe
              key={source.embedUrl}
              src={source.embedUrl}
              title={title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setStreamReady(true)}
              className="h-full w-full border-0"
            />

            {/* Shield top external Share / Copy-Link / Title chrome without blocking center play or bottom controls */}
            {source.provider === 'youtube' && (
              <>
                <div
                  aria-hidden="true"
                  onContextMenu={blockContextMenu}
                  className="pointer-events-auto absolute inset-x-0 top-0 z-10 h-14 bg-transparent"
                  title="External YouTube sharing is disabled inside classroom"
                />
                <div
                  aria-hidden="true"
                  onContextMenu={blockContextMenu}
                  className="pointer-events-auto absolute bottom-0 right-12 z-10 h-10 w-24 bg-transparent"
                />
              </>
            )}

            {(source.provider === 'vimeo' || source.provider === 'bunny') && (
              <div
                aria-hidden="true"
                onContextMenu={blockContextMenu}
                className="pointer-events-auto absolute right-0 top-0 z-10 h-16 w-28 bg-transparent"
              />
            )}
          </>
        ) : source.directUrl ? (
          <video
            key={source.directUrl}
            src={source.directUrl}
            poster={posterUrl}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            playsInline
            autoPlay={autoplay}
            onContextMenu={blockContextMenu}
            onCanPlay={() => setStreamReady(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-slate-400">
            <ShieldCheck className="h-7 w-7 text-emerald-500/70" />
            <p>Stream link unavailable or unsupported format.</p>
          </div>
        )}
      </div>

      {/* Subtle Custom Control Bar */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 dark:border-emerald-900/80 dark:bg-[#04140a] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>{source.label}</span>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800 shrink-0">
            ·
          </span>
          <span className="truncate text-slate-600 dark:text-slate-300">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {allowExternalLink && source.externalUrl && (
            <a
              href={source.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#031109] dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {onToggleTheater && (
            <button
              type="button"
              onClick={onToggleTheater}
              aria-pressed={theaterMode}
              aria-label="Toggle theater mode"
              className="hidden lg:inline-flex rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-600 dark:border-emerald-900/80 dark:bg-[#031109] p-1.5 dark:text-slate-300 dark:hover:border-emerald-400"
            >
              {theaterMode ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
