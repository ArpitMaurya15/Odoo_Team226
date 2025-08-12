'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Plus, MapPin, Calendar, IndianRupee, Plane, Heart } from 'lucide-react'
import { TripWithDetails } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<TripWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [favoritePlaces, setFavoritePlaces] = useState<any[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchTrips()
      fetchUserProfile()
      fetchFavoritePlaces()
    }
  }, [session, status])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserName(data.user.name || session?.user?.name || 'Traveler')
      } else {
        // Fallback to session data if API fails
        setUserName(session?.user?.name || 'Traveler')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to session data
      setUserName(session?.user?.name || 'Traveler')
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips)
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFavoritePlaces = async () => {
    try {
      const response = await fetch('/api/cities/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavoritePlaces(data.favorites || [])
      }
    } catch (error) {
      console.error('Error fetching favorite places:', error)
    } finally {
      setFavoritesLoading(false)
    }
  }

  const removeFavorite = async (place: any) => {
    try {
      const response = await fetch('/api/cities/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: place.placeId
        })
      })

      if (response.ok) {
        // Remove from local state
        setFavoritePlaces(prev => prev.filter(p => p.id !== place.id))
      } else {
        console.error('Failed to remove favorite')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > new Date())
  const pastTrips = trips.filter(trip => new Date(trip.endDate) < new Date())
  const totalBudget = trips.reduce((sum, trip) => sum + (trip.totalBudget || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showNavigation={true} />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName || 'Traveler'}!
          </h1>
          <p className="text-gray-600">Ready to plan your next adventure?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingTrips.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Places</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoritePlaces.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/trips/create">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Plan New Trip</h3>
                    <p className="text-sm text-gray-600">Start planning your next adventure</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/cities">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Explore Cities</h3>
                    <p className="text-sm text-gray-600">Discover amazing destinations</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/trips">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold">My Trips</h3>
                    <p className="text-sm text-gray-600">View and manage your trips</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Favorite Places */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Favorite Places</h2>
            <Link href="/cities">
              <Button variant="outline">Explore More</Button>
            </Link>
          </div>

          {favoritesLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-lg">Loading favorites...</div>
              </CardContent>
            </Card>
          ) : favoritePlaces.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorite places yet</h3>
                  <p className="text-gray-600 mb-4">Start exploring cities and mark your favorites!</p>
                  <Link href="/cities">
                    <Button>Explore Cities</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoritePlaces.slice(0, 6).map((place) => (
                <Card key={place.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="truncate">{place.placeName}</CardTitle>
                    <CardDescription>
                      {place.city}, {place.country}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {place.type && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {place.type}
                        </div>
                      )}
                      {place.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-1">⭐</span>
                          {place.rating.toFixed(1)} rating
                        </div>
                      )}
                      {place.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {place.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const query = encodeURIComponent([place.placeName, place.city, place.state, place.country].filter(Boolean).join(', '))
                          window.open(`https://www.google.com/maps/search/${query}`, '_blank')
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        View Map
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeFavorite(place)}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trips */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Trips</h2>
            <Link href="/trips">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {trips.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                  <p className="text-gray-600 mb-4">Start planning your first adventure!</p>
                  <Link href="/trips/create">
                    <Button>Create Your First Trip</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.slice(0, 6).map((trip) => (
                <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="truncate">{trip.name}</CardTitle>
                    <CardDescription>
                      {formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {trip.stops.length} destination{trip.stops.length !== 1 ? 's' : ''}
                      </div>
                      {trip.totalBudget && (
                        <div className="flex items-center text-sm text-gray-600">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {formatCurrency(trip.totalBudget)} budget
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link href={`/trips/${trip.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
