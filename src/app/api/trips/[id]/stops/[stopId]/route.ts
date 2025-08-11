import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
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

    const { name, startDate, endDate } = await request.json()

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Parse city name and country
    const cityParts = name.split(',').map((part: string) => part.trim())
    const cityName = cityParts[0]
    const country = cityParts.length > 1 ? cityParts[1] : 'Unknown'

    // Find or create the city
    let city = await prisma.city.findUnique({
      where: {
        name_country: {
          name: cityName,
          country: country
        }
      }
    })

    if (!city) {
      // Create a new city with default values
      city = await prisma.city.create({
        data: {
          name: cityName,
          country: country,
          region: null,
          latitude: 0,
          longitude: 0,
          description: null,
          costIndex: null,
          popularity: 0
        }
      })
    }

    // Update the stop
    const updatedStop = await prisma.stop.update({
      where: {
        id: params.stopId,
      },
      data: {
        cityId: city.id,
        startDate: start,
        endDate: end,
      },
      include: {
        city: true,
        activities: true
      }
    })

    return NextResponse.json({ 
      message: 'Stop updated successfully',
      stop: updatedStop
    })
  } catch (error) {
    console.error('Error updating stop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete the stop (activities will be cascade deleted)
    await prisma.stop.delete({
      where: {
        id: params.stopId,
      },
    })

    return NextResponse.json({ 
      message: 'Stop deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting stop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
