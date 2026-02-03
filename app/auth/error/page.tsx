import Link from "next/link"

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-8">Something went wrong during authentication.</p>
        <Link 
          href="/login" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Return to login
        </Link>
      </div>
    </div>
  )
}