import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const city = searchParams.get('city')
    const state = searchParams.get('state') 
    const country = searchParams.get('country')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
    }

    // Use Pexels API to search for real images based on destination name and location
    const imageSearchResults = await searchPexelsForDestination(query, city, state, country)
    
    return NextResponse.json({ imageUrl: imageSearchResults })
    
  } catch (error) {
    console.error('Image search error:', error)
    return NextResponse.json({ error: 'Failed to search images' }, { status: 500 })
  }
}

async function searchPexelsForDestination(
  destinationName: string, 
  city?: string | null, 
  state?: string | null, 
  country?: string | null
): Promise<string> {
  // Use Pexels API key if available, otherwise fall back to curated images
  const pexelsApiKey = process.env.PEXELS_API_KEY

  if (pexelsApiKey && pexelsApiKey !== "YOUR_PEXELS_API_KEY_HERE") {
    try {
      // Build comprehensive search query with destination + location
      const locationParts = [city, state, country].filter(Boolean)
      const fullLocation = locationParts.join(' ')
      
      // Clean and enhance the search query for better results
      const cleanedName = destinationName.toLowerCase()
        .replace(/\b(city|state|province|region|area|district)\b/g, '') // Remove common location words
        .replace(/\s+/g, ' ')
        .trim()

      // Create multiple search variations including location information
      const searchQueries = [
        `${cleanedName} ${fullLocation} landmark`,
        `${cleanedName} ${fullLocation} travel`,
        `${cleanedName} ${country} tourist attraction`,
        `${cleanedName} ${city} famous place`,
        `${cleanedName} ${fullLocation}`,
        `${cleanedName} travel landmark`,
        `${cleanedName} tourist attraction`
      ].filter(query => query.trim().length > 0) // Remove empty queries

      console.log(`Searching for images of "${destinationName}" in ${fullLocation}`)

      // Try each search query until we find good results
      for (const searchQuery of searchQueries) {
        const encodedQuery = encodeURIComponent(searchQuery.trim())
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=10&orientation=landscape`,
          {
            headers: {
              'Authorization': pexelsApiKey
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.photos && data.photos.length > 0) {
            // Filter photos that are more likely to be relevant (higher resolution, better quality)
            const goodPhotos = data.photos.filter((photo: any) => 
              photo.width >= 800 && photo.height >= 600
            )
            
            if (goodPhotos.length > 0) {
              const photo = goodPhotos[0]
              console.log(`Found Pexels image for "${destinationName}" in ${fullLocation} using query "${searchQuery}"`)
              return photo.src.large2x || photo.src.large || photo.src.medium
            }
          }
        }

        // Small delay between requests to respect API limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Pexels API error:', error)
    }
  }

  // Fallback to curated destination images if Pexels API fails or no key
  console.log(`Using curated fallback image for "${destinationName}"`)
  return getCuratedDestinationImage(destinationName)
}

function getCuratedDestinationImage(destinationName: string): string {
  // - Bing Image Search API
  
  const searchQuery = destinationName.toLowerCase().trim()
  
  // For now, let's use a curated list of real destination images from free sources
  const destinationImageMap: { [key: string]: string } = {
    'taj mahal': 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'goa beaches': 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'golden temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amrithsar_7.jpg/1200px-The_Golden_Temple_of_Amrithsar_7.jpg',
    'kerala backwaters': 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'rajasthan palaces': 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'himalayas': 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'mumbai': 'https://www.andbeyond.com/wp-content/uploads/sites/5/Chhatrapati-Shivaji-Terminus-railway-station-mumbai.jpg',
    'tokyo': 'https://images.pexels.com/photos/315191/pexels-photo-315191.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'santorini': 'https://images.pexels.com/photos/161901/santorini-oia-greece-water-161901.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'paris': 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'bali': 'https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'new york': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'swiss alps': 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'himalayan mountains': 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'backwaters of kerala': 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'ranthambore national park': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIjj82c72CXWUkGw_5lq9sTNlJz6U4N-4D5w&s',
    'himalayan trekking': 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  }

  // Check for exact match first
  if (destinationImageMap[searchQuery]) {
    return destinationImageMap[searchQuery]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(destinationImageMap)) {
    if (searchQuery.includes(key) || key.includes(searchQuery)) {
      return value
    }
  }

  // Default fallback based on destination type keywords
  if (searchQuery.includes('beach')) {
    return 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  } else if (searchQuery.includes('mountain') || searchQuery.includes('himalaya')) {
    return 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  } else if (searchQuery.includes('temple') || searchQuery.includes('palace')) {
    return 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  } else if (searchQuery.includes('city') || searchQuery.includes('urban')) {
    return 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  }

  // Final fallback - a beautiful travel image
  return 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
}
