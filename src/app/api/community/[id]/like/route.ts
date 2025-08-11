import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if the user has already liked this post
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // User has already liked the post, so unlike it
      await prisma.communityLike.delete({
        where: {
          id: existingLike.id
        }
      })

      // Decrement the likes count
      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: {
          likes: {
            decrement: 1
          }
        }
      })

      return NextResponse.json({ 
        likes: updatedPost.likes,
        isLiked: false
      })
    } else {
      // User hasn't liked the post, so like it
      await prisma.communityLike.create({
        data: {
          postId: postId,
          userId: session.user.id
        }
      })

      // Increment the likes count
      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: {
          likes: {
            increment: 1
          }
        }
      })

      return NextResponse.json({ 
        likes: updatedPost.likes,
        isLiked: true
      })
    }
  } catch (error) {
    console.error('Error handling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
