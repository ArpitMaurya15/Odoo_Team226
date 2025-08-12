import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the trip exists and user owns it
    const existingTrip = await prisma.trip.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (existingTrip.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this trip' },
        { status: 403 }
      )
    }

    const { name, description, location, type, estimatedDuration, notes } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      )
    }

    // Get the current highest order number for activities in this trip
    const lastActivity = await prisma.activity.findFirst({
      where: { tripId: params.id },
      orderBy: { order: 'desc' }
    })
    
    const nextOrder = lastActivity ? lastActivity.order + 1 : 1

    // Map the type to ActivityCategory enum
    const categoryMap: { [key: string]: string } = {
      'attraction': 'SIGHTSEEING',
      'restaurant': 'DINING',
      'hotel': 'ACCOMMODATION',
      'museum': 'SIGHTSEEING',
      'park': 'OUTDOOR',
      'beach': 'OUTDOOR',
      'shopping': 'SHOPPING',
      'entertainment': 'ENTERTAINMENT',
      'transport': 'TRANSPORT'
    }

    const category = categoryMap[type?.toLowerCase()] || 'SIGHTSEEING'

    // Create the activity
    const activity = await prisma.activity.create({
      data: {
        tripId: params.id,
        name: name,
        description: description || `${name} in ${location || 'destination'}`,
        category: category as any,
        cost: null,
        order: nextOrder,
        notes: notes || `Added from city recommendations - ${location || ''}`,
        startTime: null,
        endTime: null
      }
    })

    return NextResponse.json({
      success: true,
      activity: {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        category: activity.category,
        order: activity.order,
        notes: activity.notes
      }
    })

  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the trip exists and user owns it
    const existingTrip = await prisma.trip.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        activities: {
          orderBy: { order: 'asc' }
        }
      },
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (existingTrip.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'You do not have permission to view this trip' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      activities: existingTrip.activities
    })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
