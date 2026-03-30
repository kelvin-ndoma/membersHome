import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

export default function AdminLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}