export default function AccountStatus({ message, error, className = '' }: {
  message: string
  error: string
  className?: string
}) {
  if (!message && !error) return null

  return (
    <div className={className}>
      {message ? (
        <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={`${message ? 'mt-3' : ''} rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
