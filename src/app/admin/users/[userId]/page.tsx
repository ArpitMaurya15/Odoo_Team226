'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { 
  Users, 
  MapPin, 
  Activity, 
  ArrowLeft,
  Calendar, 
  IndianRupee,
  Plane,
  User
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface UserDetails {
  id: string
  name: string
  email: string
  createdAt: string
  stats: {
    totalTrips: number
    totalActivities: number
    totalBudget: number
    citiesVisited: number
  }
  popularDestinations: Array<{
    city: string
    count: number
  }>
  activityCategories: { [key: string]: number }
  trips: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    totalBudget: number
    citiesCount: number
    activitiesCount: number
  }>
}

export default function AdminUserDetails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && params.userId) {
      if (session.user.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchUserDetails()
    }
  }, [session, params.userId, router])

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', response.status, errorData)
        setError(`Failed to load user details: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      setError('An error occurred while loading user details')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} isAdminPage={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} isAdminPage={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading User</h2>
              <p className="text-gray-600 mb-6">{error || 'User not found'}</p>
              <Link href="/admin">
                <Button>Back to Admin Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showNavigation={true} isAdminPage={true} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {formatDate(new Date(user.createdAt))}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">User Details</span>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.totalTrips}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cities Visited</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.citiesVisited}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.totalActivities}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(user.stats.totalBudget)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Popular Destinations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Popular Destinations</span>
                </CardTitle>
                <CardDescription>Cities this user visits most</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.popularDestinations.slice(0, 8).map((destination, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{destination.city}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{destination.count} visits</span>
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(destination.count / user.popularDestinations[0]?.count) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activity Categories</span>
                </CardTitle>
                <CardDescription>Types of activities this user plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(user.activityCategories)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([category, count], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium capitalize">{category.toLowerCase()}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{count} activities</span>
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${(count / Math.max(...Object.values(user.activityCategories))) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User's Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5" />
                <span>User's Trips</span>
              </CardTitle>
              <CardDescription>All trips created by this user</CardDescription>
            </CardHeader>
            <CardContent>
              {user.trips.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">✈️</div>
                  <p className="text-gray-600">No trips created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Trip Name</th>
                        <th className="text-left p-3">Duration</th>
                        <th className="text-left p-3">Cities</th>
                        <th className="text-left p-3">Activities</th>
                        <th className="text-left p-3">Budget</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.trips.map((trip) => (
                        <tr key={trip.id} className="border-b">
                          <td className="p-3">
                            <div className="font-medium">{trip.name}</div>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {trip.citiesCount} cities
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {trip.activitiesCount} activities
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {trip.totalBudget ? formatCurrency(trip.totalBudget) : 'No budget'}
                          </td>
                          <td className="p-3">
                            <Link href={`/trips/${trip.id}`}>
                              <Button variant="outline" size="sm">
                                View Trip
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
