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

    const { name, description, startDate, endDate, totalBudget, coverImage } = await request.json()

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

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
