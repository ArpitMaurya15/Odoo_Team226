'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { MapPin, Calendar, IndianRupee, ArrowRight, Plane, ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Trip {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  totalBudget: number | null
  cities: Array<{
    id: string
    name: string
    country: string
  }>
  stops: Array<{
    id: string
  }>
}

export default function SelectItineraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchTrips()
    }
  }, [session])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips)
      } else {
        setError('Failed to load trips')
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      setError('An error occurred while loading trips')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trips...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
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
        <div className="max-w-4xl mx-auto">
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
              <span className="text-gray-900">Itinerary</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Trip Itinerary</h1>
            <p className="text-gray-600">Choose a trip to view and manage its itinerary</p>
          </div>

          {/* Trips List */}
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-600 mb-6">You haven't created any trips yet. Create your first trip to start planning!</p>
              <Link href="/trips/create">
                <Button>
                  <Plane className="h-4 w-4 mr-2" />
                  Create Your First Trip
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => {
                const totalDays = Math.ceil(
                  (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
                )

                return (
                  <Card key={trip.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{trip.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </CardTitle>
                      {trip.description && (
                        <CardDescription className="line-clamp-2">{trip.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.cities?.length || 0} cities • {totalDays} days</span>
                        </div>

                        {trip.totalBudget && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <IndianRupee className="h-4 w-4" />
                            <span>{formatCurrency(trip.totalBudget)} budget</span>
                          </div>
                        )}

                        <div className="pt-3 space-y-2">
                          <Link href={`/trips/${trip.id}/itinerary/preview`} className="block">
                            <Button variant="outline" className="w-full">
                              View Itinerary
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                          <Link href={`/trips/${trip.id}/itinerary`} className="block">
                            <Button className="w-full">
                              Edit Itinerary
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>

                        {trip.stops.length === 0 && (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            No stops planned yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Quick Actions */}
          {trips.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Want to create a new trip?</p>
              <Link href="/trips/create">
                <Button variant="outline">
                  <Plane className="h-4 w-4 mr-2" />
                  Create New Trip
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
