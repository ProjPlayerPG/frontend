'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { igdbUrlWithSize } from '@/lib/igdb'

export type GameVideo = {
  id?: number
  name?: string
  video_id?: string
}

export type GameScreenshot = {
  id?: number
  image_id?: string
  url?: string
  width?: number
  height?: number
}

function videoPriority(name = '') {
  const normalizedName = name.toLowerCase()

  if (normalizedName.includes('launch trailer')) return 50
  if (normalizedName.includes('official trailer')) return 40
  if (normalizedName.includes('announcement trailer')) return 30
  if (normalizedName.includes('gameplay')) return 20
  if (normalizedName.includes('trailer')) return 10
  return 0
}

export function selectPreferredVideo(videos: GameVideo[] = []) {
  return videos
    .filter((video) => /^[a-zA-Z0-9_-]{6,20}$/.test(video.video_id ?? ''))
    .map((video, index) => ({ video, index, priority: videoPriority(video.name) }))
    .sort((left, right) => right.priority - left.priority || left.index - right.index)[0]?.video ?? null
}

export default function GameMediaGallery({
  gameName,
  coverUrl,
  videos = [],
  screenshots = [],
}: {
  gameName: string
  coverUrl: string | null
  videos?: GameVideo[]
  screenshots?: GameScreenshot[]
}) {
  const availableScreenshots = useMemo(
    () => screenshots.filter((screenshot) => screenshot.url).slice(0, 5),
    [screenshots],
  )
  const preferredVideo = useMemo(() => selectPreferredVideo(videos), [videos])
  const [selectedScreenshot, setSelectedScreenshot] = useState(0)
  const [playing, setPlaying] = useState(false)
  const screenshot = availableScreenshots[selectedScreenshot]
  const screenshotUrl = igdbUrlWithSize(screenshot?.url, 't_1080p')
  const posterUrl = screenshotUrl || coverUrl
  const hasAdditionalMedia = Boolean(preferredVideo || availableScreenshots.length)

  return (
    <section aria-label={`Médias de ${gameName}`} className="min-w-0">
      <div className="relative aspect-video overflow-hidden rounded-[1.7rem] border border-[var(--line-strong)] bg-[var(--background-deep)] shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
        {playing && preferredVideo?.video_id ? (
          <>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${preferredVideo.video_id}?rel=0&playsinline=1`}
              title={`${preferredVideo.name || 'Trailer'} — ${gameName}`}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="absolute right-3 top-3 z-10 rounded-full border border-white/25 bg-black/75 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-black/90"
            >
              Revenir aux images
            </button>
          </>
        ) : (
          <>
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={screenshotUrl ? `Capture de ${gameName}` : `Illustration de ${gameName}`}
                fill
                sizes="(max-width: 1024px) calc(100vw - 4rem), 760px"
                className={`object-cover ${screenshotUrl ? '' : 'scale-110 blur-[2px]'}`}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(126,184,205,0.18),transparent_28%),radial-gradient(circle_at_25%_80%,rgba(223,191,122,0.2),transparent_32%),linear-gradient(135deg,#101d2d,#07101b)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,9,18,0.08),rgba(4,9,18,0.68))]" />

            {preferredVideo ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
                aria-label={`Voir ${preferredVideo.name || 'le trailer'} de ${gameName}`}
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/35 bg-black/55 text-[var(--accent)] shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur transition group-hover:scale-105 group-hover:border-[var(--accent)] group-hover:bg-black/70">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-current">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.22em] text-white">
                    Voir la bande-annonce
                  </span>
                  <span className="mt-2 block text-xs text-white/70">
                    {preferredVideo.name || 'Vidéo proposée par IGDB'}
                  </span>
                </span>
              </button>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">
                  {screenshotUrl ? `Capture ${selectedScreenshot + 1} sur ${availableScreenshots.length}` : 'Archives du jeu'}
                </p>
                {!hasAdditionalMedia ? (
                  <p className="mt-2 text-sm text-white/65">Aucun média supplémentaire disponible sur IGDB.</p>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {availableScreenshots.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Choisir une capture">
          {availableScreenshots.map((item, index) => {
            const thumbnailUrl = igdbUrlWithSize(item.url, 't_thumb')

            return thumbnailUrl ? (
              <button
                key={item.id ?? item.image_id ?? index}
                type="button"
                onClick={() => {
                  setSelectedScreenshot(index)
                  setPlaying(false)
                }}
                aria-label={`Afficher la capture ${index + 1}`}
                aria-pressed={index === selectedScreenshot && !playing}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition ${
                  index === selectedScreenshot && !playing
                    ? 'border-[var(--accent)] opacity-100'
                    : 'border-[var(--line)] opacity-60 hover:border-[var(--line-strong)] hover:opacity-100'
                }`}
              >
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ) : null
          })}
        </div>
      ) : null}
    </section>
  )
}
