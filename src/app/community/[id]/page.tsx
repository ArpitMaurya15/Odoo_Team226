'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Navbar } from '@/components/navbar'
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Star,
  MapPin,
  Calendar,
  User,
  Send,
  ArrowLeft
} from 'lucide-react'

interface CommunityComment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
  }
}

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
    description?: string
  }
  comments: CommunityComment[]
}

const POST_TYPE_LABELS: Record<string, string> = {
  'TRIP_REVIEW': 'Trip Review',
  'ACTIVITY_REVIEW': 'Activity Review',
  'DESTINATION_GUIDE': 'Destination Guide',
  'TRAVEL_TIP': 'Travel Tip',
  'PHOTO_SHARE': 'Photo Sharing',
  'QUESTION': 'Question',
  'OTHER': 'Other'
}

export default function CommunityPostDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && params.id) {
      fetchPost()
    }
  }, [session, params.id])

  const fetchPost = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/community/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else if (response.status === 404) {
        setError('Post not found')
      } else {
        setError('Failed to load post')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      setError('An error occurred while loading the post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setIsSubmittingComment(true)
      const response = await fetch(`/api/community/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const comment = await response.json()
        setPost(prev => prev ? {
          ...prev,
          comments: [comment, ...prev.comments]
        } : null)
        setNewComment('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleLike = async () => {
    if (!post || isLiking) return

    try {
      setIsLiking(true)
      const response = await fetch(`/api/community/${post.id}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setPost(prev => prev ? {
          ...prev,
          likes: data.likes,
          isLiked: data.isLiked
        } : null)
      }
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      setIsLiking(false)
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} showBackButton={true} backHref="/community" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading post...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} showBackButton={true} backHref="/community" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/community')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showNavigation={true} showBackButton={true} backHref="/community" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{post.user.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {POST_TYPE_LABELS[post.type] || post.type}
                </span>
              </div>

              {post.destination && (
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{post.destination}</span>
                </div>
              )}

              {post.rating && (
                <div className="mb-3">
                  {renderStars(post.rating)}
                </div>
              )}

              {post.trip && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <strong>Related Trip:</strong> {post.trip.name}
                  </p>
                </div>
              )}

              {post.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.split(',').map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500 pt-3 border-t">
                <button 
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
                    post.isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'hover:text-red-500'
                  }`}
                >
                  <Heart 
                    className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} 
                  />
                  <span>{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
                </button>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments.length} comments</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views} views</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Comments ({post.comments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* New Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Share your thoughts about this post..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
                    </Button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {post.comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  post.comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-blue-100 pl-4 py-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{comment.user.name}</span>
                        <span className="text-sm text-gray-500">
                          {formatDateShort(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
