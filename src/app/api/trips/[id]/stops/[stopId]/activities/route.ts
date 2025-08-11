import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; stopId: string } }
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

    // Check if the stop exists and belongs to this trip
    const existingStop = await prisma.stop.findUnique({
      where: {
        id: params.stopId,
      },
    })

    if (!existingStop || existingStop.tripId !== params.id) {
      return NextResponse.json(
        { error: 'Stop not found' },
        { status: 404 }
      )
    }

    const { activities } = await request.json()

    console.log('Received activities data:', { activities, tripId: params.id, stopId: params.stopId })

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return NextResponse.json(
        { error: 'Activities data is required' },
        { status: 400 }
      )
    }

    // Get the current highest order number for activities in this stop
    const lastActivity = await prisma.activity.findFirst({
      where: { stopId: params.stopId },
      orderBy: { order: 'desc' }
    })
    
    let currentOrder = lastActivity ? lastActivity.order + 1 : 1

    const createdActivities = []

    for (const activityData of activities) {
      const { name, description, startTime, estimatedCost, category } = activityData

      if (!name || !name.trim()) {
        continue // Skip invalid activities
      }

      // Create the activity
      const activity = await prisma.activity.create({
        data: {
          tripId: params.id,
          stopId: params.stopId,
          name: name.trim(),
          description: description?.trim() || null,
          category: category || 'SIGHTSEEING',
          startTime: startTime ? new Date(startTime) : null,
          endTime: null,
          cost: estimatedCost ? parseFloat(estimatedCost) : null,
          order: currentOrder,
          notes: null
        }
      })

      createdActivities.push(activity)
      currentOrder++
    }

    return NextResponse.json({ 
      message: 'Activities created successfully',
      activities: createdActivities
    })
  } catch (error) {
    console.error('Error creating activities:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tripId: params.id,
      stopId: params.stopId
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
