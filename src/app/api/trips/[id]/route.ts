import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Find the trip with all related data
    const trip = await prisma.trip.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        stops: {
          include: {
            city: true,
            activities: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        },
        activities: true,
        expenses: true,
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this trip
    const isOwner = session?.user?.email === trip.user.email
    const isPublic = trip.isPublic

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: 'You do not have permission to view this trip' },
        { status: 403 }
      )
    }

    // Transform the data to match the expected format
    const uniqueCities = Array.from(
      new Map(trip.stops.map((stop: any) => [stop.city.id, stop.city])).values()
    );
    
    const transformedTrip = {
      ...trip,
      cities: uniqueCities,
    }

    return NextResponse.json({ trip: transformedTrip })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { name, description, startDate, endDate, totalBudget, coverImage, isPublic } = await request.json()

    // Prepare update data, only including defined values
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (totalBudget !== undefined) updateData.totalBudget = totalBudget ? parseFloat(totalBudget) : null
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (isPublic !== undefined) updateData.isPublic = isPublic

    // Update the trip
    const updatedTrip = await prisma.trip.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        stops: {
          include: {
            city: true,
            activities: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        },
        activities: true,
        expenses: true,
      },
    })

    // Transform the data
    const uniqueCities = Array.from(
      new Map(updatedTrip.stops.map((stop: any) => [stop.city.id, stop.city])).values()
    );
    
    const transformedTrip = {
      ...updatedTrip,
      cities: uniqueCities,
    }

    return NextResponse.json({ trip: transformedTrip })
  } catch (error) {
    console.error('Error updating trip:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: 'You do not have permission to delete this trip' },
        { status: 403 }
      )
    }

    // Delete the trip (cascade will handle related records)
    await prisma.trip.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
