'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, MapPin, Calendar, Clock, IndianRupee, Edit, Eye, Share2, Copy, MessageCircle, Mail, ExternalLink, Navigation, Sparkles, MapIcon } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Activity {
  id: string
  name: string
  description?: string
  startTime?: string
  cost?: number
}

interface Stop {
  id: string
  order: number
  startDate: string
  endDate: string
  city: {
    id: string
    name: string
    country: string
  }
  activities: Activity[]
}

interface Trip {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  totalBudget: number | null
  user: {
    email: string
    name: string
  }
  stops: Stop[]
}

export default function ItineraryPreviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showAiPlanner, setShowAiPlanner] = useState(false)
  const [aiDestination, setAiDestination] = useState('')
  const [aiItinerary, setAiItinerary] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    // Allow viewing without authentication, but redirect to signin for unauthenticated users only if they try to edit
    if (status === 'unauthenticated') {
      // Don't redirect immediately - allow viewing the preview
      // Only redirect if they try to access edit functionality
    }
  }, [status, router])

  useEffect(() => {
    // Fetch trip data regardless of authentication status for public preview
    if (params.id) {
      fetchTrip()
    }
  }, [params.id])

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showShareOptions && !target.closest('.share-dropdown')) {
        setShowShareOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareOptions])

  const fetchTrip = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/trips/${params.id}/preview`)
      
      if (response.ok) {
        const data = await response.json()
        setTrip(data.trip)
      } else {
        setError('Failed to load trip')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
      setError('An error occurred while loading the trip')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    setShowShareOptions(!showShareOptions)
  }

  const copyToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/trips/${params.id}/itinerary/preview`
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareViaWhatsApp = () => {
    const shareUrl = `${window.location.origin}/trips/${params.id}/itinerary/preview`
    const message = `Check out my travel itinerary for "${trip?.name}": ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaEmail = () => {
    const shareUrl = `${window.location.origin}/trips/${params.id}/itinerary/preview`
    const subject = `Travel Itinerary: ${trip?.name}`
    const body = `Hi!\n\nI'd like to share my travel itinerary for "${trip?.name}" with you.\n\nYou can view the full itinerary here: ${shareUrl}\n\nLet me know what you think!\n\nBest regards`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const shareViaNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareUrl = `${window.location.origin}/trips/${params.id}/itinerary/preview`
        await navigator.share({
          title: `Travel Itinerary: ${trip?.name}`,
          text: `Check out my travel itinerary for "${trip?.name}"`,
          url: shareUrl,
        })
      } catch (err) {
        console.error('Error sharing: ', err)
      }
    }
  }

  const handleAiPlanner = () => {
    setShowAiPlanner(true)
  }

  const generateAiItinerary = async () => {
    if (!aiDestination.trim()) {
      alert('Please enter a destination')
      return
    }

    if (!trip) {
      alert('Trip information not available')
      return
    }

    // Calculate number of days from trip dates
    const tripDays = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1 // Add 1 to include both start and end days

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: aiDestination,
          days: tripDays
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiItinerary(data.itinerary)
      } else {
        throw new Error('Failed to generate itinerary')
      }
    } catch (error) {
      console.error('Error generating AI itinerary:', error)
      alert('Failed to generate itinerary. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const closeAiPlanner = () => {
    setShowAiPlanner(false)
    setAiItinerary(null)
    setAiDestination('')
    setSaveSuccess(false)
  }

  const saveAiItinerary = async () => {
    if (!aiItinerary) return

    setSaveLoading(true)
    try {
      const response = await fetch('/api/save-ai-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary: aiItinerary,
          tripId: params.id // Pass the current trip ID
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSaveSuccess(true)
        // Refresh the current page to show the updated itinerary
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save itinerary')
      }
    } catch (error) {
      console.error('Error saving itinerary:', error)
      alert('Failed to save itinerary. Please try again.')
    } finally {
      setSaveLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    )
  }

  // Remove the unauthenticated check - allow public viewing

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/itinerary">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Itinerary
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Trip not found</h2>
          <Link href="/itinerary">
            <Button>Back to Itinerary</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = session?.user?.email === trip.user.email
  const isAuthenticated = status === 'authenticated'
  const totalDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/itinerary">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Itinerary
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Eye className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Itinerary Preview</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative">
              {/* AI Planner Button */}
              <Button
                onClick={handleAiPlanner}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0 hover:from-purple-600 hover:to-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Planner</span>
              </Button>
              
              {isAuthenticated && (
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              )}
              {isOwner && (
                <Link href={`/trips/${params.id}/itinerary`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Itinerary
                  </Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/auth/signin">
                  <Button variant="outline">
                    Sign In to Share
                  </Button>
                </Link>
              )}
              
              {/* Share Options Dropdown */}
              {showShareOptions && (
                <div className="share-dropdown absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Share this itinerary</h3>
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
          {/* Trip Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
              <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Shared Preview
              </div>
            </div>
            {trip.description && (
              <p className="text-gray-600 mb-4">{trip.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{totalDays} days</span>
              </div>
              {trip.totalBudget && (
                <div className="flex items-center space-x-1">
                  <IndianRupee className="h-4 w-4" />
                  <span>{formatCurrency(trip.totalBudget)} budget</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Itinerary */}
          <div className="space-y-0">
            {trip.stops.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary available</h3>
                  <p className="text-gray-600 mb-4">This trip doesn't have any stops planned yet.</p>
                  {isOwner ? (
                    <Link href={`/trips/${params.id}/itinerary`}>
                      <Button>
                        <Edit className="h-4 w-4 mr-2" />
                        Start Planning
                      </Button>
                    </Link>
                  ) : (
                    <p className="text-gray-500 text-sm">The trip owner hasn't added any stops yet.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>
                
                {trip.stops
                  .sort((a, b) => a.order - b.order)
                  .map((stop, index) => {
                    // Calculate which day of the trip this stop represents
                    const tripStartDate = new Date(trip.startDate)
                    const stopStartDate = new Date(stop.startDate)
                    
                    // Reset time to start of day for accurate comparison
                    tripStartDate.setHours(0, 0, 0, 0)
                    stopStartDate.setHours(0, 0, 0, 0)
                    
                    const dayOfTrip = Math.floor(
                      (stopStartDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1
                    const isLast = index === trip.stops.length - 1

                    return (
                      <div key={stop.id} className="relative">
                        {/* Timeline Node */}
                        <div className="absolute left-6 top-6 w-4 h-4 bg-white border-4 border-blue-500 rounded-full z-10 shadow-lg"></div>
                        
                        {/* Stop Content */}
                        <div className="ml-16 pb-8">
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
                                  <span className="font-medium">{formatDate(new Date(stop.startDate))} - {formatDate(new Date(stop.endDate))}</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span>Day {dayOfTrip}</span>
                                </div>
                              </div>
                            </div>

                            {/* Activities Timeline */}
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                  <Navigation className="h-5 w-5 text-indigo-600" />
                                  <span>Activities</span>
                                </h4>
                                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                                  {stop.activities.length} {stop.activities.length === 1 ? 'activity' : 'activities'}
                                </div>
                              </div>
                              
                              {stop.activities.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                  <p className="text-gray-500 text-sm">No activities planned for this stop</p>
                                </div>
                              ) : (
                                <div className="relative">
                                  {/* Activities Timeline Line */}
                                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-purple-300"></div>
                                  
                                  <div className="space-y-4">
                                    {stop.activities.map((activity, actIndex) => (
                                      <div key={activity.id} className="relative">
                                        {/* Activity Timeline Node */}
                                        <div className="absolute left-2.5 top-3 w-3 h-3 bg-white border-2 border-indigo-400 rounded-full z-10"></div>
                                        
                                        {/* Activity Content */}
                                        <div className="ml-10 bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-2">
                                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                                                  #{actIndex + 1}
                                                </span>
                                                <h5 className="font-semibold text-gray-900">{activity.name}</h5>
                                              </div>
                                              {activity.description && (
                                                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{activity.description}</p>
                                              )}
                                              <div className="flex items-center space-x-4 text-xs">
                                                {activity.startTime && (
                                                  <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{formatDate(new Date(activity.startTime))}</span>
                                                  </div>
                                                )}
                                                {activity.cost && (
                                                  <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                                                    <IndianRupee className="h-3 w-3" />
                                                    <span>{formatCurrency(activity.cost)}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
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

                        {/* Travel Connector (except for last stop) */}
                        {!isLast && (
                          <div className="ml-16 -mt-4 mb-4">
                            <div className="bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="flex items-center justify-center space-x-2 text-gray-600">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                                <span className="text-sm font-medium">Travel to next destination</span>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Trip Summary Timeline */}
          {trip.stops.length > 0 && (
            <div className="mt-8">
              <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200 overflow-hidden shadow-lg">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-2 left-2 w-16 h-16 bg-emerald-300 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-2 right-2 w-20 h-20 bg-cyan-300 rounded-full blur-2xl"></div>
                </div>

                {/* Header */}
                <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-1 flex items-center space-x-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <Navigation className="h-4 w-4" />
                        </div>
                        <span>Trip Journey Overview</span>
                      </h3>
                      <p className="text-emerald-100 text-sm">Your complete travel timeline summary</p>
                    </div>
                    <div className="hidden md:block">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatDate(new Date(trip.startDate))}</div>
                          <div className="text-xs text-emerald-200">Start Date</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative p-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="group text-center transform hover:scale-105 transition-all duration-300">
                      <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <MapPin className="h-5 w-5 text-white relative z-10" />
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800">{trip.stops.length}</span>
                        </div>
                      </div>
                      <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {trip.stops.length}
                      </div>
                      <div className="text-xs text-emerald-700 font-medium">{trip.stops.length === 1 ? 'Destination' : 'Destinations'}</div>
                    </div>

                    <div className="group text-center transform hover:scale-105 transition-all duration-300">
                      <div className="relative bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Calendar className="h-5 w-5 text-white relative z-10" />
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{totalDays}</span>
                        </div>
                      </div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {totalDays}
                      </div>
                      <div className="text-xs text-blue-700 font-medium">{totalDays === 1 ? 'Day' : 'Days'}</div>
                    </div>

                    <div className="group text-center transform hover:scale-105 transition-all duration-300">
                      <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Navigation className="h-5 w-5 text-white relative z-10" />
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800">{trip.stops.reduce((sum, stop) => sum + stop.activities.length, 0)}</span>
                        </div>
                      </div>
                      <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {trip.stops.reduce((sum, stop) => sum + stop.activities.length, 0)}
                      </div>
                      <div className="text-xs text-purple-700 font-medium">Activities</div>
                    </div>

                    <div className="group text-center transform hover:scale-105 transition-all duration-300">
                      <div className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <IndianRupee className="h-5 w-5 text-white relative z-10" />
                        {trip.totalBudget && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-800">₹</span>
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {trip.totalBudget ? formatCurrency(trip.totalBudget) : 'N/A'}
                      </div>
                      <div className="text-xs text-orange-700 font-medium">Budget</div>
                    </div>
                  </div>
                  
                  {/* Journey Path */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-md">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1.5 rounded-full shadow-md">
                        <h4 className="text-sm font-bold flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>Journey Path</span>
                        </h4>
                      </div>
                    </div>
                    
                    <div className="relative">
                      {/* Journey Timeline */}
                      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
                        {trip.stops
                          .sort((a, b) => a.order - b.order)
                          .map((stop, index) => (
                            <div key={stop.id} className="flex items-center group">
                              <div className="flex flex-col items-center min-w-0 relative">
                                {/* Stop Node */}
                                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full w-10 h-10 flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <span className="text-sm font-bold text-white">{index + 1}</span>
                                </div>
                                
                                {/* City Name */}
                                <div className="mt-1 text-center">
                                  <div className="text-xs font-bold text-gray-800 max-w-16 truncate">
                                    {stop.city.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {Math.ceil((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / (1000 * 60 * 60 * 24))}d
                                  </div>
                                </div>

                                {/* Hover Details */}
                                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 whitespace-nowrap">
                                  <div className="font-medium">{stop.city.name}</div>
                                  <div>{formatDate(new Date(stop.startDate))} - {formatDate(new Date(stop.endDate))}</div>
                                  <div>{stop.activities.length} activities</div>
                                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-l-transparent border-r-2 border-r-transparent border-b-2 border-b-gray-900"></div>
                                </div>
                              </div>
                              
                              {/* Connection Arrow */}
                              {index < trip.stops.length - 1 && (
                                <div className="flex items-center mx-2">
                                  <div className="relative">
                                    {/* Animated Line */}
                                    <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full relative overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2">
                                      <div className="w-0 h-0 border-l-4 border-l-teal-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Trip Duration */}
                    <div className="text-center mt-3 pt-2 border-t border-emerald-200">
                      <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-1 rounded-full border border-emerald-300">
                        <Clock className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-800 font-medium text-xs">
                          {formatDate(new Date(trip.startDate))} → {formatDate(new Date(trip.endDate))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Planner Modal */}
      {showAiPlanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">AI Travel Planner</h2>
              </div>
              <Button onClick={closeAiPlanner} variant="ghost" size="sm">
                ✕
              </Button>
            </div>

            <div className="p-6">
              {!aiItinerary ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <MapIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Where do you want to travel?</h3>
                    <p className="text-gray-600">Let AI create a personalized itinerary with trending places for your destination</p>
                    {trip && (
                      <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                        {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day itinerary for your trip
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destination
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Paris, Tokyo, New York, Goa..."
                        value={aiDestination}
                        onChange={(e) => setAiDestination(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={generateAiItinerary}
                      disabled={aiLoading || !aiDestination.trim()}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-2"
                    >
                      {aiLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating Itinerary...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Generate AI Itinerary</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Generated Itinerary Display */}
                  <div className="text-center border-b pb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{aiItinerary.destination}</h3>
                    <p className="text-gray-600">{aiItinerary.totalDays} Day{aiItinerary.totalDays > 1 ? 's' : ''} Itinerary</p>
                    <div className="mt-2 inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <IndianRupee className="h-4 w-4" />
                      <span>{aiItinerary.estimatedBudget}</span>
                    </div>
                  </div>

                  {/* Days Itinerary */}
                  <div className="space-y-6">
                    {aiItinerary.days.map((day: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                          <CardTitle className="text-lg text-purple-900">{day.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            {day.activities.map((activity: any, actIndex: number) => (
                              <div key={actIndex} className="flex space-x-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 w-16 text-center">
                                  <div className="text-sm font-semibold text-purple-600">{activity.time}</div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{activity.location}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{activity.duration}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <IndianRupee className="h-3 w-3" />
                                      <span>{activity.cost}</span>
                                    </span>
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      {activity.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Travel Tips */}
                  {aiItinerary.tips && aiItinerary.tips.length > 0 && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-yellow-800">💡 Travel Tips</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {aiItinerary.tips.map((tip: string, index: number) => (
                            <li key={index} className="text-yellow-700 flex items-start space-x-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 pt-4 border-t">
                    {saveSuccess ? (
                      <div className="text-center">
                        <div className="text-green-600 mb-2">
                          ✅ AI itinerary added to your trip successfully!
                        </div>
                        <p className="text-sm text-gray-600">Refreshing to show updated itinerary...</p>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setAiItinerary(null)
                            setAiDestination('')
                          }}
                          variant="outline"
                        >
                          Generate New Itinerary
                        </Button>
                        
                        {isAuthenticated && (
                          <Button
                            onClick={saveAiItinerary}
                            disabled={saveLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {saveLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span>💾</span>
                                <span>Add to This Trip</span>
                              </div>
                            )}
                          </Button>
                        )}
                        
                        {!isAuthenticated && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">Sign in to save this itinerary</p>
                            <Link href="/auth/signin">
                              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                Sign In
                              </Button>
                            </Link>
                          </div>
                        )}
                        
                        <Button onClick={closeAiPlanner} className="bg-purple-600 hover:bg-purple-700 text-white">
                          Close
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
