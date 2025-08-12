'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Navbar } from '@/components/navbar'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Plus, 
  Heart, 
  MessageCircle, 
  Eye, 
  Star,
  MapPin,
  Calendar,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

interface CommunityPost {
  id: string
  title: string
  content: string
  type: string
  destination?: string
  rating?: number
  tags?: string
  images?: string
  likes: number
  views: number
  isLiked: boolean
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
  }
  trip?: {
    id: string
    name: string
  }
  _count: {
    comments: number
  }
}

interface CommunityResponse {
  posts: CommunityPost[]
  totalCount: number
  currentPage: number
  totalPages: number
}

const POST_TYPES = [
  { value: 'ALL', label: 'All Posts' },
  { value: 'TRIP_REVIEW', label: 'Trip Reviews' },
  { value: 'ACTIVITY_REVIEW', label: 'Activity Reviews' },
  { value: 'DESTINATION_GUIDE', label: 'Destination Guides' },
  { value: 'TRAVEL_TIP', label: 'Travel Tips' },
  { value: 'PHOTO_SHARE', label: 'Photo Sharing' },
  { value: 'QUESTION', label: 'Questions' },
  { value: 'OTHER', label: 'Other' }
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Latest' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'rating', label: 'Highest Rated' }
]

export default function CommunityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [itineraryPosts, setItineraryPosts] = useState<CommunityPost[]>([])
  const [reviewPosts, setReviewPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [itineraryTotalPages, setItineraryTotalPages] = useState(1)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'reviews' | 'itineraries'>('reviews')
  
  // Share Itinerary Modal states
  const [showShareItineraryModal, setShowShareItineraryModal] = useState(false)
  const [userTrips, setUserTrips] = useState<any[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [selectedTripForSharing, setSelectedTripForSharing] = useState<any>(null)
  const [shareItineraryForm, setShareItineraryForm] = useState({
    title: '',
    content: '',
    tags: ''
  })
  const [isSharingItinerary, setIsSharingItinerary] = useState(false)
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())

  // New post form states
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'TRIP_REVIEW',
    destination: '',
    rating: 5,
    tags: '',
    images: ''
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to first page when search/filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedType, destinationFilter, activeTab])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchReviewPosts()
      fetchItineraryPosts()
    }
  }, [status, session, debouncedSearchTerm, selectedType, sortBy, sortOrder, destinationFilter, currentPage])

  // Refetch data when tab changes
  useEffect(() => {
    if (session?.user) {
      if (activeTab === 'reviews') {
        fetchReviewPosts()
      } else {
        fetchItineraryPosts()
      }
    }
  }, [activeTab])

  // Fetch regular community posts (reviews, tips, etc.)
  const fetchReviewPosts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        excludeItineraries: 'true' // Exclude posts with tripId
      })

      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (selectedType !== 'ALL') params.append('type', selectedType)
      if (destinationFilter) params.append('destination', destinationFilter)

      const response = await fetch(`/api/community?${params}`)
      if (response.ok) {
        const data: CommunityResponse = await response.json()
        setReviewPosts(data.posts)
        setReviewTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching review posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch shared itinerary posts
  const fetchItineraryPosts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        onlyItineraries: 'true' // Only posts with tripId
      })

      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (destinationFilter) params.append('destination', destinationFilter)

      const response = await fetch(`/api/community?${params}`)
      if (response.ok) {
        const data: CommunityResponse = await response.json()
        setItineraryPosts(data.posts)
        setItineraryTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching itinerary posts:', error)
    }
  }

  const fetchPosts = async () => {
    if (activeTab === 'reviews') {
      await fetchReviewPosts()
    } else {
      await fetchItineraryPosts()
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tagsArray = newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      const imagesArray = newPost.images.split(',').map(img => img.trim()).filter(Boolean)

      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          tags: tagsArray,
          images: imagesArray
        })
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewPost({
          title: '',
          content: '',
          type: 'TRIP_REVIEW',
          destination: '',
          rating: 5,
          tags: '',
          images: ''
        })
        fetchReviewPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  // Fetch user trips for sharing
  const fetchUserTrips = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoadingTrips(true)
      const response = await fetch('/api/trips')
      
      if (response.ok) {
        const data = await response.json()
        setUserTrips(data.trips || [])
      }
    } catch (err) {
      console.error('Error fetching trips:', err)
    } finally {
      setLoadingTrips(false)
    }
  }

  // Open share itinerary modal
  const openShareItineraryModal = () => {
    setShowShareItineraryModal(true)
    fetchUserTrips()
  }

  // Handle itinerary selection
  const selectItineraryForSharing = (trip: any) => {
    setSelectedTripForSharing(trip)
    setShareItineraryForm({
      title: `My ${trip.name} Itinerary`,
      content: `Check out my detailed itinerary for ${trip.name}! This trip covers ${trip.stops?.length || 0} destinations from ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}.`,
      tags: `itinerary, ${trip.name}, travel plan`
    })
  }

  // Share selected itinerary
  const shareItinerary = async () => {
    if (!selectedTripForSharing || !shareItineraryForm.title.trim() || !shareItineraryForm.content.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsSharingItinerary(true)
      
      // First, fetch the complete trip data with stops and activities
      const tripResponse = await fetch(`/api/trips/${selectedTripForSharing.id}`)
      if (!tripResponse.ok) {
        throw new Error('Failed to fetch trip details')
      }
      
      const tripData = await tripResponse.json()
      console.log('Complete trip data:', tripData)
      
      const tagsArray = shareItineraryForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      
      // Create community post with the complete trip data
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shareItineraryForm.title,
          content: shareItineraryForm.content,
          type: 'SHARED_ITINERARY',
          destination: tripData.destination || tripData.name,
          tripId: selectedTripForSharing.id,
          tags: tagsArray,
          rating: 5
        })
      })

      if (response.ok) {
        setShowShareItineraryModal(false)
        setSelectedTripForSharing(null)
        setShareItineraryForm({ title: '', content: '', tags: '' })
        fetchItineraryPosts()
        alert('✅ Your complete itinerary has been shared with the community!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`❌ Failed to share itinerary: ${errorData.error || 'Please try again.'}`)
      }
    } catch (error) {
      console.error('Error sharing itinerary:', error)
      alert('❌ Failed to share itinerary. Please try again.')
    } finally {
      setIsSharingItinerary(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (likingPosts.has(postId)) return

    try {
      setLikingPosts(prev => new Set(prev).add(postId))
      
      const response = await fetch(`/api/community/${postId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        // Update both post arrays
        setReviewPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes, isLiked: data.isLiked }
            : post
        ))
        setItineraryPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes, isLiked: data.isLiked }
            : post
        ))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading community posts...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showNavigation={true} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <nav className="text-sm text-gray-500">
              <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Community</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Community</h1>
              <p className="text-gray-600">Share your experiences and discover new destinations</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={openShareItineraryModal}>
                <Calendar className="h-4 w-4 mr-2" />
                Share Itinerary
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Share Experience
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Community Reviews & Tips</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {reviewPosts.length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('itineraries')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'itineraries'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Shared Itineraries</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {itineraryPosts.length}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className={`grid gap-4 mb-4 ${activeTab === 'itineraries' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
              {/* Search */}
              <div className="relative">
                <Search className={`h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  searchTerm !== debouncedSearchTerm ? 'text-blue-500 animate-pulse' : 'text-gray-400'
                }`} />
                <Input
                  placeholder={activeTab === 'itineraries' ? "Search itineraries..." : "Search posts..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm !== debouncedSearchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Post Type Filter - Only show for reviews tab */}
              {activeTab === 'reviews' && (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {POST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Destination Filter */}
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Filter by destination..."
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort Options */}
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(activeTab === 'reviews' ? reviewPosts : itineraryPosts).map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{post.title}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>{post.user.name}</span>
                        <Calendar className="h-4 w-4 ml-2" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                      {/* Show trip info for itinerary posts */}
                      {activeTab === 'itineraries' && post.trip && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>Trip: {post.trip.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {activeTab === 'itineraries' ? 'Itinerary' : (POST_TYPES.find(t => t.value === post.type)?.label || post.type)}
                      </span>
                      {activeTab === 'itineraries' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Shared Plan
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.content}</p>
                  
                  {post.destination && (
                    <div className="flex items-center space-x-1 mb-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{post.destination}</span>
                    </div>
                  )}

                  {post.rating && renderStars(post.rating)}

                  {post.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={likingPosts.has(post.id)}
                        className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
                          post.isLiked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views}</span>
                      </div>
                    </div>
                    <Link href={`/community/${post.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {(activeTab === 'reviews' ? reviewTotalPages : itineraryTotalPages) > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: (activeTab === 'reviews' ? reviewTotalPages : itineraryTotalPages) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, (activeTab === 'reviews' ? reviewTotalPages : itineraryTotalPages)))}
                disabled={currentPage === (activeTab === 'reviews' ? reviewTotalPages : itineraryTotalPages)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Create Post Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Share Your Experience</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        placeholder="Give your post a catchy title..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="type">Post Type</Label>
                      <select
                        id="type"
                        value={newPost.type}
                        onChange={(e) => setNewPost({...newPost, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {POST_TYPES.slice(1).map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        placeholder="Share your experience, tips, or insights..."
                        rows={6}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="destination">Destination</Label>
                        <Input
                          id="destination"
                          value={newPost.destination}
                          onChange={(e) => setNewPost({...newPost, destination: e.target.value})}
                          placeholder="e.g., Paris, France"
                        />
                      </div>

                      <div>
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <select
                          id="rating"
                          value={newPost.rating}
                          onChange={(e) => setNewPost({...newPost, rating: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating} Star{rating > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={newPost.tags}
                        onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                        placeholder="e.g., adventure, budget-friendly, family"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Share Experience
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Share Itinerary Modal */}
          <Dialog open={showShareItineraryModal} onOpenChange={setShowShareItineraryModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Share Your Itinerary</DialogTitle>
                <DialogDescription>
                  Select one of your trip itineraries to share with the community
                </DialogDescription>
              </DialogHeader>

              {!selectedTripForSharing ? (
                /* Itinerary Selection */
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Choose an Itinerary to Share</h3>
                  
                  {loadingTrips ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your trips...</p>
                    </div>
                  ) : userTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {userTrips.map((trip) => (
                        <Card 
                          key={trip.id} 
                          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
                          onClick={() => selectItineraryForSharing(trip)}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg">{trip.name}</CardTitle>
                            <CardDescription>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <MapPin className="h-4 w-4" />
                                  <span>{trip.stops?.length || 0} destinations</span>
                                </div>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {trip.description || 'No description available'}
                            </p>
                            <Button className="w-full mt-3" size="sm">
                              Select This Itinerary
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
                      <p className="text-gray-600 mb-4">You need to create a trip first before sharing an itinerary.</p>
                      <Link href="/trips/create">
                        <Button>Create Your First Trip</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                /* Share Form */
                <div className="space-y-6">
                  {/* Selected Trip Preview */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span>Selected Itinerary: {selectedTripForSharing.name}</span>
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>{new Date(selectedTripForSharing.startDate).toLocaleDateString()} - {new Date(selectedTripForSharing.endDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{selectedTripForSharing.stops?.length || 0} destinations</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Share Form */}
                  <form onSubmit={(e) => { e.preventDefault(); shareItinerary(); }} className="space-y-4">
                    <div>
                      <Label htmlFor="share-title">Post Title *</Label>
                      <Input
                        id="share-title"
                        value={shareItineraryForm.title}
                        onChange={(e) => setShareItineraryForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Give your shared itinerary a catchy title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="share-content">Description *</Label>
                      <Textarea
                        id="share-content"
                        value={shareItineraryForm.content}
                        onChange={(e) => setShareItineraryForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Describe your itinerary, highlight key attractions, tips, or experiences..."
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="share-tags">Tags</Label>
                      <Input
                        id="share-tags"
                        value={shareItineraryForm.tags}
                        onChange={(e) => setShareItineraryForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="itinerary, travel plan, destination name..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                    </div>

                    <div className="flex justify-between space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setSelectedTripForSharing(null)}
                      >
                        Back to Selection
                      </Button>
                      <div className="flex space-x-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowShareItineraryModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isSharingItinerary}
                        >
                          {isSharingItinerary ? 'Sharing...' : 'Share Itinerary'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
