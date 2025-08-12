import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        favoritePlaces: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ favorites: user.favoritePlaces })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { placeId, placeName, city, country, state, type, rating, description } = await request.json()

    if (!placeId || !placeName || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoritePlace.findFirst({
      where: {
        userId: user.id,
        placeId: placeId
      }
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Place already in favorites' }, { status: 400 })
    }

    // Add to favorites
    const favorite = await prisma.favoritePlace.create({
      data: {
        userId: user.id,
        placeId,
        placeName,
        city,
        country,
        state,
        type,
        rating: rating ? parseFloat(rating) : null,
        description
      }
    })

    return NextResponse.json({ favorite })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { placeId } = await request.json()

    if (!placeId) {
      return NextResponse.json({ error: 'Missing placeId' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove from favorites
    await prisma.favoritePlace.deleteMany({
      where: {
        userId: user.id,
        placeId: placeId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
