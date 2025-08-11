import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total trips
    const totalTrips = await prisma.trip.count()

    // Get total activities
    const totalActivities = await prisma.activity.count()

    // Get total budget
    const budgetSum = await prisma.trip.aggregate({
      _sum: {
        totalBudget: true
      }
    })
    const totalBudget = budgetSum._sum.totalBudget || 0

    // Get popular cities
    const popularCities = await prisma.city.findMany({
      include: {
        stops: {
          select: {
            id: true
          }
        }
      }
    })

    const cityStats = popularCities.map((city: any) => ({
      cityName: city.name,
      country: city.country || 'Unknown',
      visitCount: city.stops.length
    })).sort((a: any, b: any) => b.visitCount - a.visitCount)

    // Get popular activities
    const popularActivities = await prisma.activity.groupBy({
      by: ['name', 'category'],
      _count: {
        name: true
      },
      orderBy: {
        _count: {
          name: 'desc'
        }
      },
      take: 20
    })

    const activityStats = popularActivities.map((activity: any) => ({
      activityName: activity.name,
      category: activity.category || 'OTHER',
      count: activity._count.name
    }))

    // Get monthly user registrations (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyUsers = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      }
    })

    // Process monthly registrations
    const monthlyRegistrations = processMonthlyData(monthlyUsers, 'createdAt')

    // Get monthly trip creation
    const monthlyTrips = await prisma.trip.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      }
    })

    const tripsByMonth = processMonthlyData(monthlyTrips, 'createdAt')

    // Get budget trends
    const monthlyBudgets = await prisma.trip.groupBy({
      by: ['createdAt'],
      _sum: {
        totalBudget: true
      },
      _avg: {
        totalBudget: true
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo
        },
        totalBudget: {
          not: null
        }
      }
    })

    const budgetTrends = monthlyBudgets.map((budget: any) => {
      const date = new Date(budget.createdAt)
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalBudget: budget._sum.totalBudget || 0,
        averageBudget: budget._avg.totalBudget || 0
      }
    })

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        trips: {
          select: {
            id: true
          }
        }
      }
    })

    const recentUsersData = recentUsers.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      tripCount: user.trips.length
    }))

    const stats = {
      totalUsers,
      totalTrips,
      totalActivities,
      totalBudget,
      popularCities: cityStats,
      popularActivities: activityStats,
      userTrends: {
        monthlyRegistrations,
        tripsByMonth,
        budgetTrends
      },
      recentUsers: recentUsersData
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function processMonthlyData(data: any[], dateField: string) {
  const monthCounts: { [key: string]: number } = {}
  
  data.forEach(item => {
    const date = new Date(item[dateField])
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
  })

  return Object.entries(monthCounts).map(([month, count]) => ({
    month,
    count
  })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
}
