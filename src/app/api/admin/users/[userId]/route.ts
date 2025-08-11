import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - check role instead of hardcoded email
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 })
    }

    const { userId } = params

    // Get user details with trips and activities
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trips: {
          include: {
            stops: {
              include: {
                city: true,
                activities: true
              }
            },
            activities: true,
            expenses: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate user statistics
    const totalTrips = user.trips.length
    const totalActivities = user.trips.reduce((sum: number, trip: any) => 
      sum + trip.stops.reduce((stopSum: number, stop: any) => stopSum + stop.activities.length, 0) + trip.activities.length, 0
    )
    const totalBudget = user.trips.reduce((sum: number, trip: any) => sum + (trip.totalBudget || 0), 0)
    
    // Get unique cities visited through stops
    const citiesVisitedSet = new Set<string>()
    user.trips.forEach((trip: any) => {
      trip.stops.forEach((stop: any) => {
        citiesVisitedSet.add(stop.city.id)
      })
    })
    const citiesVisited = citiesVisitedSet.size

    // Get user's popular destinations (cities from stops)
    const citiesMap: { [key: string]: number } = {}
    user.trips.forEach((trip: any) => {
      trip.stops.forEach((stop: any) => {
        const key = `${stop.city.name}, ${stop.city.country}`
        citiesMap[key] = (citiesMap[key] || 0) + 1
      })
    })

    const popularDestinations = Object.entries(citiesMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)

    // Get user's activity categories
    const activityCategories: { [key: string]: number } = {}
    user.trips.forEach((trip: any) => {
      // Activities from stops
      trip.stops.forEach((stop: any) => {
        stop.activities.forEach((activity: any) => {
          const category = activity.category || 'OTHER'
          activityCategories[category] = (activityCategories[category] || 0) + 1
        })
      })
      // Activities directly on trip
      trip.activities.forEach((activity: any) => {
        const category = activity.category || 'OTHER'
        activityCategories[category] = (activityCategories[category] || 0) + 1
      })
    })

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      stats: {
        totalTrips,
        totalActivities,
        totalBudget,
        citiesVisited
      },
      popularDestinations,
      activityCategories,
      trips: user.trips.map((trip: any) => ({
        id: trip.id,
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalBudget: trip.totalBudget,
        citiesCount: new Set(trip.stops.map((stop: any) => stop.city.id)).size,
        activitiesCount: trip.stops.reduce((sum: number, stop: any) => sum + stop.activities.length, 0) + trip.activities.length
      }))
    }

    return NextResponse.json({ user: userData })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
