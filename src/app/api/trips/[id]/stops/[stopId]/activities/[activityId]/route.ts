import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stopId: string; activityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tripId, stopId, activityId } = params

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { user: true }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized to modify this trip' }, { status: 403 })
    }

    // Verify stop exists and belongs to trip
    const stop = await prisma.stop.findUnique({
      where: { 
        id: stopId,
        tripId: tripId
      }
    })

    if (!stop) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 })
    }

    // Verify activity exists and belongs to stop
    const activity = await prisma.activity.findUnique({
      where: { 
        id: activityId,
        stopId: stopId
      }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Delete the activity
    await prisma.activity.delete({
      where: { id: activityId }
    })

    return NextResponse.json({ message: 'Activity deleted successfully' })

  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
