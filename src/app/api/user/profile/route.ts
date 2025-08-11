import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse preferences from JSON
    const preferences = user.preferences as any || {}

    return NextResponse.json({
      user: {
        ...user,
        bio: preferences.bio || '',
        location: preferences.location || '',
        travelStyle: preferences.travelStyle || '',
        interests: preferences.interests || [],
        preferredCurrency: preferences.preferredCurrency || 'INR',
      },
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, location, travelStyle, interests, preferredCurrency } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Find the user
    const existingUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare preferences object
    const preferences = {
      bio: bio || '',
      location: location || '',
      travelStyle: travelStyle || '',
      interests: Array.isArray(interests) ? interests : [],
      preferredCurrency: preferredCurrency || 'INR',
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        name: name.trim(),
        preferences,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        preferences: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        bio: preferences.bio,
        location: preferences.location,
        travelStyle: preferences.travelStyle,
        interests: preferences.interests,
        preferredCurrency: preferences.preferredCurrency,
      },
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
