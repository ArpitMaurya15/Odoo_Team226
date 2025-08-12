'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  ArrowLeft,
  Share2,
  Copy,
  Mail,
  Clock,
  IndianRupee,
  Navigation,
  ExternalLink
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

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
  tripId?: string
  user: {
    id: string
    name: string
    image?: string
  }
  trip?: {
    id: string
    name: string
    description?: string
    startDate: string
    endDate: string
    totalBudget?: number
    stops: Array<{
      id: string
      order: number
      startDate: string
      endDate: string
      city: {
        id: string
        name: string
        country: string
      }
      activities: Array<{
        id: string
        name: string
        description?: string
        startTime?: string
        cost?: number
      }>
    }>
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
  'SHARED_ITINERARY': 'Shared Itinerary',
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
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showCopyTripModal, setShowCopyTripModal] = useState(false)
  const [isCopyingTrip, setIsCopyingTrip] = useState(false)
  const [copyTripForm, setCopyTripForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user && params.id) {
      fetchPost()
    }
  }, [status, session, params.id])

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

  const handleShare = () => {
    setShowShareOptions(!showShareOptions)
  }

  const copyToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/community/${params.id}`
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareViaWhatsApp = () => {
    const shareUrl = `${window.location.origin}/community/${params.id}`
    const message = `Check out this travel post: "${post?.title}" - ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaEmail = () => {
    const shareUrl = `${window.location.origin}/community/${params.id}`
    const subject = `Travel Post: ${post?.title}`
    const body = `Hi!\n\nI found this interesting travel post and thought you might like it.\n\n"${post?.title}"\n\nYou can read it here: ${shareUrl}\n\nBest regards`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const shareViaNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareUrl = `${window.location.origin}/community/${params.id}`
        await navigator.share({
          title: `Travel Post: ${post?.title}`,
          text: `Check out this travel post: "${post?.title}"`,
          url: shareUrl,
        })
      } catch (err) {
        console.error('Error sharing: ', err)
      }
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

  const openCopyTripModal = () => {
    if (post?.trip) {
      setCopyTripForm({
        name: `Copy of ${post.trip.name}`,
        description: post.trip.description || '',
        startDate: '',
        endDate: ''
      })
      setShowCopyTripModal(true)
    }
  }

  const copyTrip = async () => {
    if (!post?.trip || !copyTripForm.name.trim() || !copyTripForm.startDate || !copyTripForm.endDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsCopyingTrip(true)
      
      // Create the new trip with all the data from the original
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: copyTripForm.name,
          description: copyTripForm.description,
          startDate: copyTripForm.startDate,
          endDate: copyTripForm.endDate,
          copyFromTripId: post.trip.id // Special flag to copy all stops and activities
        })
      })

      if (response.ok) {
        const newTrip = await response.json()
        setShowCopyTripModal(false)
        setCopyTripForm({ name: '', description: '', startDate: '', endDate: '' })
        alert('✅ Trip copied successfully! Redirecting to your new trip...')
        router.push(`/trips/${newTrip.trip.id}`)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`❌ Failed to copy trip: ${errorData.error || 'Please try again.'}`)
      }
    } catch (error) {
      console.error('Error copying trip:', error)
      alert('❌ Failed to copy trip. Please try again.')
    } finally {
      setIsCopyingTrip(false)
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Post not found</h2>
          <Link href="/community">
            <Button>Back to Community</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isItineraryPost = post?.trip && post?.tripId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/community">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Community
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  {isItineraryPost ? 'Shared Itinerary' : 'Community Post'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              {/* Copy Trip Button - only show for shared itineraries */}
              {isItineraryPost && post?.trip && (
                <Button
                  onClick={openCopyTripModal}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Trip</span>
                </Button>
              )}
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              
              {/* Share Options Dropdown */}
              {showShareOptions && (
                <div className="share-dropdown absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Share this post</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={copyToClipboard}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copySuccess ? 'Link copied!' : 'Copy link'}
                      </Button>
                      
                      {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <Button
                          onClick={shareViaNativeShare}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share via...
                        </Button>
                      )}
                      
                      <Button
                        onClick={shareViaWhatsApp}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Share via WhatsApp
                      </Button>
                      
                      <Button
                        onClick={shareViaEmail}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Share via Email
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
              <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {POST_TYPE_LABELS[post.type] || post.type}
              </div>
            </div>
            
            {/* Author and meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{post.user.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.destination && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{post.destination}</span>
                </div>
              )}
            </div>

            {/* Engagement stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
                  post.isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
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

            {/* Rating */}
            {post.rating && (
              <div className="mb-4">
                {renderStars(post.rating)}
              </div>
            )}

            {/* Tags */}
            {post.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.split(',').map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Content */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                  {post.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary Display (if this is a shared itinerary) */}
          {isItineraryPost && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trip Itinerary</h2>
                {post.trip && (
                  <Link href={`/trips/${post.trip.id}/itinerary/preview`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Itinerary
                    </Button>
                  </Link>
                )}
              </div>

              {/* Trip Summary */}
              {post.trip && (
                <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{post.trip.name}</h3>
                    {post.trip.description && (
                      <p className="text-gray-600 mb-4">{post.trip.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{formatDate(post.trip.startDate)} - {formatDate(post.trip.endDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span>{post.trip.stops.length} destinations</span>
                      </div>
                      {post.trip.totalBudget && (
                        <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full">
                          <IndianRupee className="h-4 w-4 text-blue-600" />
                          <span>{formatCurrency(post.trip.totalBudget)} budget</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline Itinerary */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>
                
                {post.trip && post.trip.stops &&
                  post.trip.stops
                    .sort((a, b) => a.order - b.order)
                    .map((stop, index) => {
                    const stopDays = Math.ceil(
                      (new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / (1000 * 60 * 60 * 24)
                    )

                    return (
                      <div key={stop.id} className="relative mb-8">
                        {/* Timeline Node */}
                        <div className="absolute left-6 top-6 w-4 h-4 bg-white border-4 border-blue-500 rounded-full z-10 shadow-lg"></div>
                        
                        {/* Stop Content */}
                        <div className="ml-16">
                          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                            {/* Stop Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">{stop.city.name}</h3>
                                    {stop.city.country && stop.city.country !== 'Unknown' && (
                                      <p className="text-sm text-gray-500">{stop.city.country}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                    Stop {index + 1}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{formatDate(stop.startDate)} - {formatDate(stop.endDate)}</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{stopDays} {stopDays === 1 ? 'day' : 'days'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Activities */}
                            {stop.activities.length > 0 && (
                              <div className="p-6">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                  <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                                  Planned Activities ({stop.activities.length})
                                </h4>
                                <div className="grid gap-3">
                                  {stop.activities.map((activity, actIndex) => (
                                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                        {actIndex + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-gray-900">{activity.name}</h5>
                                        {activity.description && (
                                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                        )}
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                          {activity.startTime && (
                                            <div className="flex items-center space-x-1">
                                              <Clock className="h-3 w-3" />
                                              <span>{formatDate(activity.startTime)}</span>
                                            </div>
                                          )}
                                          {activity.cost && (
                                            <div className="flex items-center space-x-1">
                                              <IndianRupee className="h-3 w-3" />
                                              <span>{formatCurrency(activity.cost)}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )}

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
                          {formatDate(comment.createdAt)}
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

      {/* Copy Trip Modal */}
      <Dialog open={showCopyTripModal} onOpenChange={setShowCopyTripModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Copy className="h-5 w-5 text-blue-600" />
              <span>Copy Trip to Your Account</span>
            </DialogTitle>
            <DialogDescription>
              Create a copy of this itinerary in your account. You can customize it as needed.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); copyTrip(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tripName">Trip Name *</Label>
              <Input
                id="tripName"
                type="text"
                placeholder="Enter trip name"
                value={copyTripForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCopyTripForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tripDescription">Description</Label>
              <Textarea
                id="tripDescription"
                placeholder="Describe your trip (optional)"
                value={copyTripForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCopyTripForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={copyTripForm.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCopyTripForm(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={copyTripForm.endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCopyTripForm(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCopyTripModal(false)}
                disabled={isCopyingTrip}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCopyingTrip || !copyTripForm.name.trim() || !copyTripForm.startDate || !copyTripForm.endDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCopyingTrip ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Trip
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
