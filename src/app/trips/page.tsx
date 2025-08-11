'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Plus, MapPin, Calendar, IndianRupee, Eye, Edit, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { TripWithDetails } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function TripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<TripWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTrips(trips.filter(trip => trip.id !== tripId))
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getTripsForDate = (date: Date) => {
    return trips.filter(trip => {
      const tripStart = new Date(trip.startDate)
      const tripEnd = new Date(trip.endDate)
      const targetDate = new Date(date)
      
      // Reset time to compare only dates
      tripStart.setHours(0, 0, 0, 0)
      tripEnd.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)
      
      return targetDate >= tripStart && targetDate <= tripEnd
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > new Date())
  const pastTrips = trips.filter(trip => new Date(trip.endDate) < new Date())
  const ongoingTrips = trips.filter(trip => {
    const now = new Date()
    return new Date(trip.startDate) <= now && new Date(trip.endDate) >= now
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
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
            <span className="text-gray-900">My Trips</span>
          </nav>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-600">Manage and view all your travel plans</p>
          </div>
          <Link href="/trips/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Trip
            </Button>
          </Link>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Trips */}
          <div className="lg:col-span-2">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{trips.length}</div>
                    <div className="text-sm text-gray-600">Total Trips</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{upcomingTrips.length}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{ongoingTrips.length}</div>
                    <div className="text-sm text-gray-600">Ongoing</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{pastTrips.length}</div>
                    <div className="text-sm text-gray-600">Past</div>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Trips Sections */}
        {ongoingTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ongoing Trips</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {ongoingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
              ))}
            </div>
          </div>
        )}

        {upcomingTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Trips</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
              ))}
            </div>
          </div>
        )}

        {pastTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Trips</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {pastTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
              ))}
            </div>
          </div>
        )}

        {trips.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                <p className="text-gray-600 mb-4">Start planning your first adventure!</p>
                <Link href="/trips/create">
                  <Button>Create Your First Trip</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Trip Calendar</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-8" />
                  ))}
                  
                  {/* Days of the month */}
                  {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                    const day = index + 1
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const tripsOnDate = getTripsForDate(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const hasTrips = tripsOnDate.length > 0
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          h-8 w-8 text-xs rounded-md transition-colors relative
                          ${isToday ? 'bg-blue-100 text-blue-800 font-bold' : ''}
                          ${hasTrips ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'hover:bg-gray-100'}
                          ${selectedDate?.toDateString() === date.toDateString() ? 'ring-2 ring-blue-500' : ''}
                        `}
                      >
                        {day}
                        {hasTrips && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Selected Date Details */}
                {selectedDate && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h4>
                    {getTripsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-2">
                        {getTripsForDate(selectedDate).map(trip => (
                          <div key={trip.id} className="bg-green-50 p-2 rounded text-xs">
                            <div className="font-medium text-green-800">{trip.name}</div>
                            <div className="text-green-600">
                              {formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No trips on this date</p>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-100 rounded" />
                      <span>Today</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-100 rounded relative">
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                      </div>
                      <span>Has trips</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function TripCard({ trip, onDelete }: { trip: TripWithDetails; onDelete: (id: string) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="truncate">{trip.name}</CardTitle>
        <CardDescription>
          {formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            {trip.stops.length} destination{trip.stops.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
          </div>
          {trip.totalBudget && (
            <div className="flex items-center text-sm text-gray-600">
              <IndianRupee className="h-4 w-4 mr-1" />
              {formatCurrency(trip.totalBudget)} budget
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/trips/${trip.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/trips/${trip.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(trip.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
