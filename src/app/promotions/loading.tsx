export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-44 bg-background-tertiary rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-background-tertiary rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-background-tertiary animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-background-tertiary rounded animate-pulse" />
                <div className="h-4 w-24 bg-background-tertiary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
