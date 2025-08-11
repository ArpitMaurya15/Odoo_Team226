'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { 
  UserRegistrationChart,
  TripsByMonthChart,
  PopularCitiesChart,
  ActivityCategoriesChart,
  BudgetTrendsChart
} from '@/components/admin/charts'
import { 
  Users, 
  MapPin, 
  Activity, 
  TrendingUp, 
  Calendar, 
  IndianRupee,
  Plane,
  Eye,
  BarChart3,
  PieChart,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  totalTrips: number
  totalActivities: number
  totalBudget: number
  popularCities: Array<{
    cityName: string
    country: string
    visitCount: number
  }>
  popularActivities: Array<{
    activityName: string
    category: string
    count: number
  }>
  userTrends: {
    monthlyRegistrations: Array<{
      month: string
      count: number
    }>
    tripsByMonth: Array<{
      month: string
      count: number
    }>
    budgetTrends: Array<{
      month: string
      totalBudget: number
      averageBudget: number
    }>
  }
  recentUsers: Array<{
    id: string
    name: string
    email: string
    createdAt: string
    tripCount: number
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [citiesCurrentPage, setCitiesCurrentPage] = useState(1)
  const citiesPerPage = 5

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      // Check if user is admin by role rather than hardcoded email
      if (session.user.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchAdminStats()
    }
  }, [session, router])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to load admin statistics')
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setError('An error occurred while loading statistics')
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
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} isAdminPage={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showNavigation={true} isAdminPage={true} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Comprehensive analytics and user management</p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTrips}</div>
                <p className="text-xs text-muted-foreground">
                  Created trips
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActivities}</div>
                <p className="text-xs text-muted-foreground">
                  Planned activities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
                <p className="text-xs text-muted-foreground">
                  Combined budgets
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Popular Cities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Popular Cities</span>
                </CardTitle>
                <CardDescription>Top destinations based on user visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  {stats.popularCities
                    .slice((citiesCurrentPage - 1) * citiesPerPage, citiesCurrentPage * citiesPerPage)
                    .map((city, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{city.cityName}</div>
                        <div className="text-sm text-gray-500">{city.country}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{city.visitCount} visits</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(city.visitCount / stats.popularCities[0]?.visitCount) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination for Cities */}
                {stats.popularCities.length > citiesPerPage && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {((citiesCurrentPage - 1) * citiesPerPage) + 1} to {Math.min(citiesCurrentPage * citiesPerPage, stats.popularCities.length)} of {stats.popularCities.length} cities
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCitiesCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={citiesCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(stats.popularCities.length / citiesPerPage) }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === citiesCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCitiesCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCitiesCurrentPage(prev => Math.min(prev + 1, Math.ceil(stats.popularCities.length / citiesPerPage)))}
                        disabled={citiesCurrentPage === Math.ceil(stats.popularCities.length / citiesPerPage)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Popular Activities</span>
                </CardTitle>
                <CardDescription>Most planned activities by users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.popularActivities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{activity.activityName}</div>
                        <div className="text-sm text-gray-500">{activity.category}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{activity.count} times</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(activity.count / stats.popularActivities[0]?.count) * 100}%`
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

          {/* User Management Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Users</span>
              </CardTitle>
              <CardDescription>Latest registered users and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Joined</th>
                      <th className="text-left p-2">Trips</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{user.name}</div>
                        </td>
                        <td className="p-2 text-sm text-gray-600">{user.email}</td>
                        <td className="p-2 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.tripCount} trips
                          </span>
                        </td>
                        <td className="p-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Charts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* User Registration Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>User Growth</span>
                  </CardTitle>
                  <CardDescription>Monthly user registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <UserRegistrationChart data={stats.userTrends.monthlyRegistrations} />
                  </div>
                </CardContent>
              </Card>

              {/* Trip Creation Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Trip Activity</span>
                  </CardTitle>
                  <CardDescription>Monthly trip creation patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <TripsByMonthChart data={stats.userTrends.tripsByMonth} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Popular Destinations Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Top Destinations</span>
                  </CardTitle>
                  <CardDescription>Most visited cities distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <PopularCitiesChart data={stats.popularCities.slice(0, 6)} />
                  </div>
                </CardContent>
              </Card>

              {/* Activity Categories Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Activity Types</span>
                  </CardTitle>
                  <CardDescription>Distribution of activity categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ActivityCategoriesChart data={stats.popularActivities} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Trends Chart */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IndianRupee className="h-5 w-5" />
                    <span>Budget Analytics</span>
                  </CardTitle>
                  <CardDescription>Monthly budget trends and averages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <BudgetTrendsChart data={stats.userTrends.budgetTrends} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
