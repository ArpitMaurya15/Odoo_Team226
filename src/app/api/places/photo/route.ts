import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('photo_reference')
    const maxWidth = searchParams.get('maxwidth') || '400'

    if (!photoReference) {
      return NextResponse.json(
        { error: 'Photo reference is required' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      )
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('Error generating photo URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate photo URL' },
      { status: 500 }
    )
  }
}
