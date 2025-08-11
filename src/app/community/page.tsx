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
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
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
  }, [debouncedSearchTerm, selectedType, destinationFilter])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchPosts()
    }
  }, [session, debouncedSearchTerm, selectedType, sortBy, sortOrder, destinationFilter, currentPage])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder
      })

      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (selectedType !== 'ALL') params.append('type', selectedType)
      if (destinationFilter) params.append('destination', destinationFilter)

      const response = await fetch(`/api/community?${params}`)
      if (response.ok) {
        const data: CommunityResponse = await response.json()
        setPosts(data.posts)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
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
        fetchPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
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
        setPosts(prev => prev.map(post => 
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
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Share Experience
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className={`h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  searchTerm !== debouncedSearchTerm ? 'text-blue-500 animate-pulse' : 'text-gray-400'
                }`} />
                <Input
                  placeholder="Search posts..."
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

              {/* Post Type Filter */}
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
            {posts.map((post) => (
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
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {POST_TYPES.find(t => t.value === post.type)?.label || post.type}
                    </span>
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
          {totalPages > 1 && (
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
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
        </div>
      </main>
    </div>
  )
}
