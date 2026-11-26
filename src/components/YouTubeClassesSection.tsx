import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Play, RefreshCw, X, Youtube } from 'lucide-react';
import { YouTubeVideo } from '../types/lms';
import {
  fetchChannelVideos,
  YOUTUBE_CHANNEL_URL,
} from '../services/youtubeSync';
import { SecureVideoPlayer } from './SecureVideoPlayer';

export const YouTubeClassesSection: React.FC = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [source, setSource] = useState<'youtube-api' | 'rss' | 'cached'>('rss');
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const result = await fetchChannelVideos(6);
    setVideos(result.videos);
    setSource(result.source);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!activeVideo) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveVideo(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeVideo]);

  return (
    <section
      aria-label="Latest Free Classes from YouTube"
      className="space-y-5 border-t border-slate-200 dark:border-emerald-900/60 pt-7"
    >
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-300">
            <Youtube className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>@tanvirssciencesquare</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-emerald-800">
              ·
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {source === 'youtube-api'
                ? 'YouTube API Live'
                : source === 'rss'
                ? 'Channel RSS Sync'
                : 'Featured Channel Classes'}
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Latest Free Classes from YouTube
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadFeed()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-600 hover:text-emerald-700 dark:border-emerald-900/80 dark:bg-[#04140a] dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Feed'}</span>
          </button>

          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#030805] dark:hover:bg-emerald-400 transition-colors whitespace-nowrap"
          >
            <span>Open Channel</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Video Grid */}
      {loading && videos.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-emerald-900/70 dark:bg-[#04140a] animate-pulse"
            >
              <div className="aspect-video w-full bg-slate-200 dark:bg-[#031109]" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-[#031109]" />
                <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-[#031109]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const canEmbed = Boolean(video.embedUrl);
            const thumbBroken = failedThumbs[video.id];

            return (
              <article
                key={video.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-emerald-500/60 dark:border-emerald-900/80 dark:bg-[#04140a] dark:hover:border-emerald-500/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (canEmbed) {
                      setActiveVideo(video);
                    } else {
                      window.open(video.watchUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="relative aspect-video w-full overflow-hidden bg-[#030805] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {!thumbBroken ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedThumbs((prev) => ({ ...prev, [video.id]: true }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950 via-[#04140a] to-[#030805] p-5 text-center">
                      <span className="font-display text-sm font-semibold text-emerald-300">
                        Tanvir&apos;s Science Square
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/95 text-[#030805] shadow-lg transition-transform duration-200 group-hover:scale-110">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </span>
                  </span>

                  <span className="absolute bottom-2.5 left-3 text-[11px] font-medium text-slate-200 tabular-nums">
                    {canEmbed ? 'Watch in Player' : 'Watch on YouTube'}
                  </span>
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (canEmbed) {
                        setActiveVideo(video);
                      } else {
                        window.open(video.watchUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="text-left focus-visible:outline-none"
                  >
                    <h3 className="font-display text-sm sm:text-base font-bold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                  </button>

                  {video.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">
                      {video.publishedAt ? `Published ${video.publishedAt}` : 'Free Class'}
                    </span>
                    <a
                      href={video.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-emerald-700 dark:text-teal-300 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Playable YouTube Embed Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 dark:bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="yt-modal-title"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-emerald-900/80 dark:bg-[#04140a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-900/70 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  Tanvir&apos;s Science Square · Free YouTube Class
                </p>
                <h3
                  id="yt-modal-title"
                  className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate"
                >
                  {activeVideo.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video player"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#031109] dark:hover:text-slate-100 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SecureVideoPlayer
              videoUrl={activeVideo.watchUrl}
              title={activeVideo.title}
              posterUrl={activeVideo.thumbnailUrl}
              autoplay
              allowExternalLink
            />
          </div>
        </div>
      )}
    </section>
  );
};
