'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, IndianRupee, Users, Edit, ArrowLeft, Clock, Globe } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Trip {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  totalBudget?: number
  coverImage?: string
  isPublic: boolean
  publicSlug?: string
  user: {
    name: string
    email: string
  }
  cities: Array<{
    id: string
    name: string
    country: string
    description?: string
  }>
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
      scheduledDate: string
      estimatedCost?: number
    }>
  }>
}

export default function TripDetailsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Trip not found')
          } else if (response.status === 403) {
            setError('You do not have permission to view this trip')
          } else {
            setError('Failed to load trip details')
          }
          return
        }

        const data = await response.json()
        setTrip(data.trip)
      } catch (error) {
        console.error('Error fetching trip:', error)
        setError('Failed to load trip details')
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [params.id, status])

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trip details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Link href="/trips">
                <Button>View All Trips</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🧳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
            <p className="text-gray-600 mb-6">The trip you're looking for doesn't exist or has been removed.</p>
            <Link href="/trips">
              <Button>View All Trips</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const totalActivities = trip.stops.reduce((sum, stop) => sum + stop.activities.length, 0)
  const totalEstimatedCost = trip.stops.reduce((sum, stop) => 
    sum + stop.activities.reduce((actSum, activity) => actSum + (activity.estimatedCost || 0), 0), 0
  )

  const isOwner = session?.user?.email === trip.user.email

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
            <p className="text-gray-600 mt-1">by {trip.user.name}</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex space-x-2">
            <Link href={`/trips/${trip.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Trip
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Trip Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Trip Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.description && (
                <p className="text-gray-700">{trip.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{totalDays} days</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.cities.length} cities</span>
                </div>
                {trip.totalBudget && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <IndianRupee className="h-4 w-4" />
                    <span>{formatCurrency(trip.totalBudget)} budget</span>
                  </div>
                )}
              </div>

              {trip.isPublic && trip.publicSlug && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm text-green-800">
                    <Globe className="h-4 w-4" />
                    <span>This trip is public and can be viewed by anyone</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itinerary */}
          <Card>
            <CardHeader>
              <CardTitle>Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              {trip.stops.length > 0 ? (
                <div className="space-y-6">
                  {trip.stops.map((stop, index) => (
                    <div key={stop.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{stop.city.name}</h3>
                        <span className="text-sm text-gray-600">
                          {formatDate(new Date(stop.startDate))} - {formatDate(new Date(stop.endDate))}
                        </span>
                      </div>
                      {stop.city.country && stop.city.country !== 'Unknown' && (
                        <p className="text-sm text-gray-600 mb-2">
                          {stop.city.country}
                        </p>
                      )}
                      
                      {/* Todo */}
                      {stop.activities.length > 0 && (
                        <div className="ml-4 space-y-2">
                          <h4 className="font-medium text-gray-800">Todo:</h4>
                          {stop.activities.map((activity) => (
                            <div key={activity.id} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">{activity.name}</h5>
                                {activity.estimatedCost && (
                                  <span className="text-sm text-gray-600">
                                    {formatCurrency(activity.estimatedCost)}
                                  </span>
                                )}
                              </div>
                              {activity.description && (
                                <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(new Date(activity.scheduledDate))}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stops planned yet</h3>
                  <p className="text-gray-600 mb-4">Start building your itinerary by adding stops to your trip.</p>
                  {isOwner && (
                    <Link href={`/trips/${trip.id}/itinerary`}>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Add Stops
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="font-medium">{totalDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cities</span>
                <span className="font-medium">{trip.cities.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stops</span>
                <span className="font-medium">{trip.stops.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Todo</span>
                <span className="font-medium">{totalActivities}</span>
              </div>
              {trip.totalBudget && (
                <>
                  <hr />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="font-medium">{formatCurrency(trip.totalBudget)}</span>
                  </div>
                  {totalEstimatedCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estimated Cost</span>
                      <span className="font-medium">{formatCurrency(totalEstimatedCost)}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner && (
                <>
                  <Link href={`/trips/${trip.id}/edit`} className="block">
                    <Button className="w-full" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Trip
                    </Button>
                  </Link>
                  <Link href={`/trips/${trip.id}/itinerary`} className="block">
                    <Button className="w-full" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Manage Itinerary
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/trips" className="block">
                <Button className="w-full" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Trips
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
