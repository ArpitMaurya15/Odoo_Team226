import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const trips = await prisma.trip.findMany({
      where: { userId: session.user.id },
      include: {
        stops: {
          include: {
            city: true,
            activities: true,
          },
          orderBy: { order: 'asc' },
        },
        activities: true,
        expenses: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, startDate, endDate, totalBudget, coverImage, copyFromTripId } = await request.json()

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If copying from an existing trip
    if (copyFromTripId) {
      // First, fetch the original trip with all its data
      const originalTrip = await prisma.trip.findUnique({
        where: { id: copyFromTripId },
        include: {
          stops: {
            include: {
              city: true,
              activities: {
                orderBy: { startTime: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      })

      if (!originalTrip) {
        return NextResponse.json(
          { message: 'Original trip not found' },
          { status: 404 }
        )
      }

      // Create the new trip
      const newTrip = await prisma.trip.create({
        data: {
          name,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          totalBudget: totalBudget ? parseFloat(totalBudget) : originalTrip.totalBudget,
          coverImage: coverImage || originalTrip.coverImage,
          userId: session.user.id,
        }
      })

      // Copy all stops and activities
      const newStops = []
      for (const stop of originalTrip.stops) {
        const newStop = await prisma.stop.create({
          data: {
            tripId: newTrip.id,
            cityId: stop.cityId,
            order: stop.order,
            startDate: stop.startDate,
            endDate: stop.endDate
          }
        })

        // Copy activities for this stop
        for (const activity of stop.activities) {
          await prisma.activity.create({
            data: {
              name: activity.name,
              description: activity.description,
              startTime: activity.startTime,
              endTime: activity.endTime,
              cost: activity.cost,
              category: activity.category,
              location: activity.location,
              notes: activity.notes,
              tripId: newTrip.id,
              stopId: newStop.id
            }
          })
        }

        newStops.push(newStop)
      }

      // Fetch the complete new trip with all related data
      const completeTrip = await prisma.trip.findUnique({
        where: { id: newTrip.id },
        include: {
          stops: {
            include: {
              city: true,
              activities: {
                orderBy: { startTime: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          },
          activities: true,
          expenses: true
        }
      })

      return NextResponse.json({ trip: completeTrip }, { status: 201 })
    }

    // Regular trip creation (non-copy)
    const trip = await prisma.trip.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalBudget: totalBudget ? parseFloat(totalBudget) : null,
        coverImage,
        userId: session.user.id,
      },
      include: {
        stops: {
          include: {
            city: true,
            activities: true,
          },
        },
        activities: true,
        expenses: true,
      },
    })

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
