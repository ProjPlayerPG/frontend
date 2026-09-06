import type { ReactNode } from 'react'
import AboutNavigation from '@/components/about/aboutNavigation'

type AboutPageShellProps = {
  currentSlug: string
  eyebrow: string
  title: string
  introduction: string
  children: ReactNode
}

export default function AboutPageShell({
  currentSlug,
  eyebrow,
  title,
  introduction,
  children,
}: AboutPageShellProps) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <AboutNavigation currentSlug={currentSlug} />

        <article className="min-w-0">
          <header className="border-b border-[var(--line)] pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-cool)]">
              {eyebrow}
            </p>
            <h1 className="font-display mt-3 text-balance text-4xl font-semibold leading-[0.98] text-[var(--foreground)] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              {introduction}
            </p>
          </header>

          <div className="about-content mt-8">{children}</div>
        </article>
      </div>
    </main>
  )
}
