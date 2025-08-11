import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isOtpEnabled } = await request.json()
    
    if (typeof isOtpEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isOtpEnabled must be a boolean' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: { isOtpEnabled },
      select: {
        id: true,
        name: true,
        email: true,
        isOtpEnabled: true,
        role: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating OTP setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
