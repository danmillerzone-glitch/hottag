export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 bg-background-tertiary rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-background-tertiary rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-10 w-full bg-background-tertiary rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="card p-4 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-background-tertiary animate-pulse mb-3" />
              <div className="h-4 w-24 bg-background-tertiary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
