export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-background-tertiary animate-pulse" />
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="h-7 w-56 bg-background-tertiary rounded animate-pulse mx-auto md:mx-0" />
              <div className="h-4 w-36 bg-background-tertiary rounded animate-pulse mx-auto md:mx-0" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {[1, 2].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-48 bg-background-tertiary rounded animate-pulse" />
            {[1, 2, 3].map(j => (
              <div key={j} className="card p-4 h-16 bg-background-tertiary/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
