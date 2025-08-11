import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Find the trip with all related data - no authentication required for preview
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
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
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
    console.error('Error fetching trip preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
