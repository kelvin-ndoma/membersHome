// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">
          Loading your dashboard...
        </h2>
      </div>
    </div>
  )
}