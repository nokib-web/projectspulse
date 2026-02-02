import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] to-[#312e81] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
          ProjectPulse
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-12">
          Track projects. Collect feedback. Stay on track.
        </p>
        <Link
          href="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
