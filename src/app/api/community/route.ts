import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const destination = searchParams.get('destination')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    console.log('Community API called with params:', { search, type, destination, sortBy, sortOrder, page, limit })

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      isPublic: true
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { 
          destination: { 
            not: null,
            contains: search 
          } 
        }
      ]
    }

    if (type && type !== 'ALL') {
      where.type = type
    }

    if (destination) {
      where.destination = { 
        not: null,
        contains: destination 
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    console.log('Query where clause:', JSON.stringify(where, null, 2))
    console.log('Query orderBy clause:', JSON.stringify(orderBy, null, 2))

    const [posts, totalCount] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          trip: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        }
      }),
      prisma.communityPost.count({ where })
    ])

    // Add like status for each post if user is authenticated
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post: any) => {
        if (session?.user?.id) {
          const userLike = await prisma.communityLike.findUnique({
            where: {
              postId_userId: {
                postId: post.id,
                userId: session.user.id
              }
            }
          })
          return {
            ...post,
            isLiked: !!userLike
          }
        }
        return {
          ...post,
          isLiked: false
        }
      })
    )

    return NextResponse.json({
      posts: postsWithLikeStatus,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error) {
    console.error('Error fetching community posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, type, destination, tripId, rating, tags, images } = body

    if (!title || !content || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const post = await prisma.communityPost.create({
      data: {
        title,
        content,
        type,
        destination,
        tripId,
        rating,
        tags: tags ? tags.join(',') : null,
        images: images ? images.join(',') : null,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        trip: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating community post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
