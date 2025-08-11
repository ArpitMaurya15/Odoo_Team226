import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || 'tourist attractions'
    const location = searchParams.get('location') || '0,0'
    const radius = parseInt(searchParams.get('radius') || '50000') // 50km default

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      )
    }

    // Use Places API Text Search to find popular destinations
    const response = await client.textSearch({
      params: {
        query: query,
        location: location,
        radius: radius,
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    })

    const places = response.data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      photos: place.photos ? place.photos.slice(0, 1).map((photo: any) => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : [],
      geometry: place.geometry,
      types: place.types || [],
      priceLevel: place.price_level,
      openingHours: place.opening_hours,
      vicinity: place.vicinity
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error('Error fetching places:', error)
    return NextResponse.json(
      { error: 'Failed to fetch places data' },
      { status: 500 }
    )
  }
}
