// app/portal/[houseSlug]/communities/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users2, 
  Plus, 
  Search, 
  Lock, 
  Globe,
  Users,
  MessageSquare,
  ChevronRight,
  Crown,
  Shield,
  UserPlus,
  Check,
  Clock,
  Sparkles
} from 'lucide-react'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  logoUrl: string | null
  isPrivate: boolean
  requiresApproval: boolean
  memberCount: number
  postCount: number
  memberRole?: 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER'
  memberStatus?: 'ACTIVE' | 'PENDING'
}

export default function CommunitiesPage() {
  const params = useParams()
  const router = useRouter()
  const houseSlug = params.houseSlug as string
  
  const [myCommunities, setMyCommunities] = useState<Community[]>([])
  const [discoverCommunities, setDiscoverCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my')
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    fetchCommunities()
  }, [houseSlug])

  const fetchCommunities = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities`)
      const data = await response.json()
      
      if (data.success) {
        setMyCommunities(data.myCommunities || [])
        setDiscoverCommunities(data.discoverCommunities || [])
        setPendingRequests(data.pendingJoinRequests || 0)
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDiscover = discoverCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
              <p className="text-gray-600 mt-1">
                Connect, share, and grow with like-minded members
              </p>
            </div>
            <button
              onClick={() => router.push(`/portal/${houseSlug}/communities/create`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Create Community
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 px-1 text-sm font-medium transition relative ${
                activeTab === 'my'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Communities
              {pendingRequests > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded-full">
                  {pendingRequests} pending
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`pb-3 px-1 text-sm font-medium transition ${
                activeTab === 'discover'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Discover
            </button>
          </nav>
        </div>

        {/* Search Bar (Discover tab only) */}
        {activeTab === 'discover' && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* Communities Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* My Communities */}
            {activeTab === 'my' && (
              <>
                {myCommunities.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users2 className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No communities yet</h3>
                    <p className="text-gray-500 mb-6">Join or create a community to get started</p>
                    <button
                      onClick={() => router.push(`/portal/${houseSlug}/communities/create`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Plus className="h-5 w-5" />
                      Create Your First Community
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCommunities.map((community) => (
                      <CommunityCard 
                        key={community.id} 
                        community={community} 
                        houseSlug={houseSlug}
                        showJoinStatus
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Discover Communities */}
            {activeTab === 'discover' && (
              <>
                {filteredDiscover.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    {searchQuery ? (
                      <>
                        <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No matching communities</h3>
                        <p className="text-gray-500">Try adjusting your search</p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No communities to discover</h3>
                        <p className="text-gray-500 mb-6">
                          Be the first to create a community in this house!
                        </p>
                        <button
                          onClick={() => router.push(`/portal/${houseSlug}/communities/create`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <Plus className="h-5 w-5" />
                          Create Community
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDiscover.map((community) => (
                      <CommunityCard 
                        key={community.id} 
                        community={community} 
                        houseSlug={houseSlug}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Community Card Component
function CommunityCard({ 
  community, 
  houseSlug, 
  showJoinStatus = false 
}: { 
  community: Community
  houseSlug: string
  showJoinStatus?: boolean
}) {
  const [joining, setJoining] = useState(false)
  const router = useRouter()

  const handleJoin = async () => {
    setJoining(true)
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${community.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      if (data.success) {
        router.refresh()
      } else {
        alert(data.error || 'Failed to join community')
      }
    } catch (error) {
      console.error('Failed to join community:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const isMember = community.memberStatus === 'ACTIVE'
  const isPending = community.memberStatus === 'PENDING'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500">
        {community.coverImage && (
          <img 
            src={community.coverImage} 
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Privacy Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
            community.isPrivate 
              ? 'bg-black/50 text-white' 
              : 'bg-white/90 text-gray-700'
          }`}>
            {community.isPrivate ? (
              <><Lock className="h-3 w-3" /> Private</>
            ) : (
              <><Globe className="h-3 w-3" /> Public</>
            )}
          </span>
        </div>
        
        {/* Member Role Badge */}
        {community.memberRole && showJoinStatus && (
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
              community.memberRole === 'OWNER' ? 'bg-yellow-500 text-white' :
              community.memberRole === 'ADMIN' ? 'bg-purple-600 text-white' :
              community.memberRole === 'MODERATOR' ? 'bg-blue-500 text-white' :
              'bg-gray-700 text-white'
            }`}>
              {community.memberRole === 'OWNER' && <Crown className="h-3 w-3" />}
              {community.memberRole === 'ADMIN' && <Shield className="h-3 w-3" />}
              {community.memberRole === 'MODERATOR' && <Shield className="h-3 w-3" />}
              {community.memberRole === 'OWNER' ? 'Owner' : 
               community.memberRole === 'ADMIN' ? 'Admin' :
               community.memberRole === 'MODERATOR' ? 'Moderator' : 'Member'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          {/* Logo */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0 -mt-8 border-4 border-white">
            {community.logoUrl ? (
              <img src={community.logoUrl} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <Users2 className="h-7 w-7 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 pt-1">
            <Link href={`/portal/${houseSlug}/communities/${community.slug}`}>
              <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition truncate">
                {community.name}
              </h3>
            </Link>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {community.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {community.postCount} posts
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
          {community.description || 'No description provided'}
        </p>

        {/* Action Buttons */}
        {showJoinStatus ? (
          <Link
            href={`/portal/${houseSlug}/communities/${community.slug}`}
            className="block text-center py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            View Community
            <ChevronRight className="inline h-4 w-4 ml-1" />
          </Link>
        ) : isMember ? (
          <Link
            href={`/portal/${houseSlug}/communities/${community.slug}`}
            className="block text-center py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <Check className="inline h-4 w-4 mr-1" />
            Member • View
          </Link>
        ) : isPending ? (
          <button
            disabled
            className="w-full py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Join Request Pending
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition disabled:opacity-50"
          >
            {joining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {community.requiresApproval ? 'Request to Join' : 'Join Community'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}