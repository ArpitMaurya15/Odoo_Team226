import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenses = await prisma.expense.findMany({
      where: {
        tripId: params.id,
        trip: {
          user: {
            email: session.user.email
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, description, category, date } = body

    // Validate required fields
    if (!amount || !description || !category) {
      return NextResponse.json(
        { error: 'Amount, description, and category are required' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        tripId: params.id,
        amount: parseFloat(amount),
        description,
        category,
        date: date ? new Date(date) : new Date()
      }
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
