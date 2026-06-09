export function SpotlightSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="panel flex min-h-52 gap-4 overflow-hidden rounded-[1.5rem] p-4"
        >
          <div className="h-44 w-32 shrink-0 rounded-[1.15rem] border border-[var(--line)] bg-white/8 sm:h-48 sm:w-36" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-36 rounded-full bg-white/8" />
            <div className="mt-5 h-8 w-3/4 rounded-full bg-white/8" />
            <div className="mt-3 h-8 w-1/2 rounded-full bg-white/8" />
            <div className="mt-5 h-7 w-28 rounded-full border border-[var(--line)] bg-white/5" />
            <div className="mt-5 grid gap-2">
              <div className="h-3 w-full rounded-full bg-white/8" />
              <div className="h-3 w-5/6 rounded-full bg-white/8" />
              <div className="h-3 w-2/3 rounded-full bg-white/8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CatalogSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="panel grid gap-4 rounded-[1.5rem] p-4 md:grid-cols-2 xl:grid-cols-[1fr,1fr,1fr,1fr,auto] xl:items-end">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="grid gap-2">
            <div className="h-3 w-24 rounded-full bg-white/8" />
            <div className="h-12 rounded-full border border-[var(--line)] bg-white/5" />
          </div>
        ))}
        <div className="h-12 rounded-full border border-[var(--line)] bg-white/5 md:col-span-2 md:mx-auto md:w-full md:max-w-lg xl:col-span-4" />
      </div>

      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="panel flex w-full flex-col gap-5 overflow-hidden rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:p-5"
        >
          <div className="h-56 w-full rounded-[1.35rem] border border-[var(--line)] bg-white/8 sm:h-36 sm:w-28 sm:shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-32 rounded-full bg-white/8" />
            <div className="mt-4 h-9 w-2/3 rounded-full bg-white/8" />
            <div className="mt-5 flex gap-2">
              <div className="h-7 w-28 rounded-full border border-[var(--line)] bg-white/5" />
              <div className="h-7 w-20 rounded-full border border-[var(--line)] bg-white/5" />
            </div>
          </div>
          <div className="h-12 w-32 rounded-full border border-[var(--line)] bg-white/5" />
        </div>
      ))}
    </div>
  )
}
