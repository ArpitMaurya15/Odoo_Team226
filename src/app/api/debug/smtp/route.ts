import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Log the exact configuration being used (without exposing the password)
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }

    console.log('SMTP Debug Config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      passLength: config.auth.pass?.length,
      passFirstChar: config.auth.pass?.charAt(0),
      passLastChar: config.auth.pass?.charAt(config.auth.pass.length - 1),
      hasSpaces: config.auth.pass?.includes(' ')
    })

    // Create transporter
    const transporter = nodemailer.createTransport(config)

    // Try to verify the connection
    try {
      await transporter.verify()
      return NextResponse.json({
        success: true,
        message: 'SMTP connection verified successfully',
        config: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.auth.user,
          passLength: config.auth.pass?.length
        }
      })
    } catch (verifyError) {
      console.error('SMTP Verification Error:', verifyError)
      return NextResponse.json({
        success: false,
        error: verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        config: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.auth.user,
          passLength: config.auth.pass?.length
        }
      })
    }

  } catch (error) {
    console.error('Error in SMTP debug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
