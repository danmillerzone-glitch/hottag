export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-background-tertiary rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-background-tertiary rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-24 bg-background-tertiary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="h-5 w-3/4 bg-background-tertiary rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-background-tertiary rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-background-tertiary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
