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

    const { stops } = await request.json()

    if (!stops || !Array.isArray(stops) || stops.length === 0) {
      return NextResponse.json(
        { error: 'Stops data is required' },
        { status: 400 }
      )
    }

    // Get the current highest order number for stops in this trip
    const lastStop = await prisma.stop.findFirst({
      where: { tripId: params.id },
      orderBy: { order: 'desc' }
    })
    
    let currentOrder = lastStop ? lastStop.order + 1 : 1

    const createdStops = []

    for (const stopData of stops) {
      const { name, startDate, endDate, budget } = stopData

      if (!name || !startDate || !endDate) {
        continue // Skip invalid stops
      }

      // Parse city name and country (assuming format like "Paris, France" or just "Paris")
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
            latitude: 0, // Default values - would need geocoding service for real coordinates
            longitude: 0,
            description: null,
            costIndex: null,
            popularity: 0
          }
        })
      }

      // Create the stop
      const stop = await prisma.stop.create({
        data: {
          tripId: params.id,
          cityId: city.id,
          order: currentOrder,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        include: {
          city: true,
          activities: true
        }
      })

      createdStops.push(stop)
      currentOrder++
    }

    return NextResponse.json({ 
      message: 'Stops created successfully',
      stops: createdStops
    })
  } catch (error) {
    console.error('Error creating stops:', error)
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

export async function PATCH(
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

    const { stopOrders } = await request.json()

    if (!stopOrders || !Array.isArray(stopOrders)) {
      return NextResponse.json(
        { error: 'Invalid stop orders data' },
        { status: 400 }
      )
    }

    // Update stop orders in a transaction
    await prisma.$transaction(
      stopOrders.map(({ id, order }) =>
        prisma.stop.update({
          where: { id },
          data: { order }
        })
      )
    )

    return NextResponse.json({ 
      message: 'Stop orders updated successfully'
    })
  } catch (error) {
    console.error('Error updating stop orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
