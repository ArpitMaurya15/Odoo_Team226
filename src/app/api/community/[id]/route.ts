import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id

    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        isPublic: true
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
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            totalBudget: true,
            stops: {
              include: {
                city: {
                  select: {
                    id: true,
                    name: true,
                    country: true
                  }
                },
                activities: {
                  orderBy: {
                    startTime: 'asc'
                  }
                }
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.communityPost.update({
      where: { id: postId },
      data: {
        views: {
          increment: 1
        }
      }
    })

    // Check if current user has liked this post
    const userLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: session.user.id
        }
      }
    })

    // Add isLiked property to the response
    const postWithLikeStatus = {
      ...post,
      isLiked: !!userLike
    }

    return NextResponse.json(postWithLikeStatus)
  } catch (error) {
    console.error('Error fetching community post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const comment = await prisma.communityComment.create({
      data: {
        content,
        postId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
