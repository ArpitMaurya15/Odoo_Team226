import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let city = ''
  
  try {
    const requestBody = await request.json()
    city = requestBody.city || ''

    if (!city) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Create a focused prompt for city places
    const prompt = `Generate exactly 8 popular tourist places to visit in "${city}". Return ONLY valid JSON in this exact format:

{
  "places": [
    {
      "name": "Place Name",
      "description": "Brief description of the place and why it's worth visiting",
      "rating": 4.5,
      "type": "Monument"
    }
  ]
}

Use these types only: Monument, Temple, Museum, Park, Beach, Market, Palace, Tower, Bridge, Square, Garden, Fort, Castle, Cathedral, Mosque, Theater, Stadium, Waterfront, Architecture, Entertainment, Shopping, Nightlife, Cultural, Historical, Nature, Urban, Adventure

Ratings must be between 4.0-5.0
Include famous landmarks, cultural sites, entertainment venues, and local attractions.
No additional text, just the JSON.`

    // Try with exponential backoff for better reliability
    let lastError
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
              ]
            })
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Gemini API Error (attempt ${attempt}):`, response.status, errorText)
          
          // If it's a 429 (quota exceeded), break and use fallback
          if (response.status === 429) {
            lastError = new Error('API quota exceeded')
            break
          }
          
          // If it's a 503 (service unavailable), retry after a delay
          if (response.status === 503 && attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // 1s, 2s delays
            continue
          }
          
          lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`)
          break
        }

        const data = await response.json()
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response structure from Gemini API')
        }

        const content = data.candidates[0].content.parts[0].text
        console.log('Raw Gemini response:', content)

        // Clean and parse the JSON
        let cleanedContent = content.trim()
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\n?/, '').replace(/\n?```$/, '')
        }
        if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\n?/, '').replace(/\n?```$/, '')
        }

        const parsedData = JSON.parse(cleanedContent)

        // Validate the structure
        if (!parsedData.places || !Array.isArray(parsedData.places)) {
          throw new Error('Invalid places format from Gemini API')
        }

        // Add IDs to places and ensure they have all required fields
        const placesWithIds = parsedData.places.slice(0, 8).map((place: any, index: number) => ({
          id: index + 1,
          name: place.name || 'Unknown Place',
          description: place.description || 'Popular attraction',
          rating: Math.min(Math.max(place.rating || 4.5, 4.0), 5.0),
          type: place.type || 'Attraction',
          city: city,
          state: '', // Will be filled by frontend if needed
          country: '' // Will be filled by frontend if needed
        }))

        return NextResponse.json({
          places: placesWithIds
        })

      } catch (fetchError) {
        console.error(`Attempt ${attempt} failed:`, fetchError)
        lastError = fetchError
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // If all attempts failed, throw the last error
    throw lastError

  } catch (error) {
    console.error('Error fetching city places:', error)
    
    // Return enhanced fallback data based on city name
    const fallbackPlaces = getFallbackPlaces(city)

    return NextResponse.json({
      places: fallbackPlaces,
      error: 'Used fallback data due to API error'
    })
  }
}

function getFallbackPlaces(cityName: string): any[] {
  const city = cityName.toLowerCase()
  
  // Enhanced fallback places based on city name
  if (city.includes('mumbai')) {
    return [
      { id: 1, name: 'Gateway of India', description: 'Iconic monument overlooking the Arabian Sea', rating: 4.5, type: 'Monument', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 2, name: 'Marine Drive', description: 'Beautiful seafront promenade known as Queen\'s Necklace', rating: 4.6, type: 'Waterfront', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 3, name: 'Chhatrapati Shivaji Terminus', description: 'UNESCO World Heritage railway station', rating: 4.4, type: 'Architecture', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 4, name: 'Elephanta Caves', description: 'Ancient rock-cut caves dedicated to Lord Shiva', rating: 4.3, type: 'Historical', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 5, name: 'Juhu Beach', description: 'Popular beach with street food and entertainment', rating: 4.2, type: 'Beach', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 6, name: 'Crawford Market', description: 'Historic market for shopping and local experience', rating: 4.1, type: 'Market', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 7, name: 'Hanging Gardens', description: 'Terraced gardens with city views', rating: 4.0, type: 'Garden', city: cityName, state: 'Maharashtra', country: 'India' },
      { id: 8, name: 'Bollywood Studios', description: 'Film city and entertainment hub', rating: 4.2, type: 'Entertainment', city: cityName, state: 'Maharashtra', country: 'India' }
    ]
  } else if (city.includes('tokyo')) {
    return [
      { id: 1, name: 'Tokyo Tower', description: 'Iconic red and white communications tower', rating: 4.5, type: 'Tower', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 2, name: 'Senso-ji Temple', description: 'Ancient Buddhist temple in Asakusa', rating: 4.7, type: 'Temple', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 3, name: 'Shibuya Crossing', description: 'World\'s busiest pedestrian crossing', rating: 4.6, type: 'Urban', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 4, name: 'Imperial Palace', description: 'Primary residence of the Emperor of Japan', rating: 4.4, type: 'Palace', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 5, name: 'Tsukiji Fish Market', description: 'Famous fish market and sushi destination', rating: 4.3, type: 'Market', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 6, name: 'Meiji Shrine', description: 'Shinto shrine surrounded by forest', rating: 4.5, type: 'Temple', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 7, name: 'Tokyo Skytree', description: 'Tallest structure in Japan with observation decks', rating: 4.4, type: 'Tower', city: cityName, state: 'Tokyo', country: 'Japan' },
      { id: 8, name: 'Ginza District', description: 'Upscale shopping and dining district', rating: 4.3, type: 'Shopping', city: cityName, state: 'Tokyo', country: 'Japan' }
    ]
  } else if (city.includes('paris')) {
    return [
      { id: 1, name: 'Eiffel Tower', description: 'Iconic iron tower and symbol of Paris', rating: 4.8, type: 'Tower', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 2, name: 'Louvre Museum', description: 'World\'s largest art museum', rating: 4.7, type: 'Museum', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 3, name: 'Notre-Dame Cathedral', description: 'Gothic cathedral with stunning architecture', rating: 4.6, type: 'Cathedral', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 4, name: 'Arc de Triomphe', description: 'Monumental arch honoring French military', rating: 4.5, type: 'Monument', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 5, name: 'Seine River Cruise', description: 'Scenic boat tour along the Seine', rating: 4.4, type: 'Waterfront', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 6, name: 'Champs-Élysées', description: 'Famous avenue for shopping and dining', rating: 4.3, type: 'Shopping', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 7, name: 'Montmartre', description: 'Artistic district with Sacré-Cœur Basilica', rating: 4.6, type: 'Cultural', city: cityName, state: 'Île-de-France', country: 'France' },
      { id: 8, name: 'Palace of Versailles', description: 'Opulent royal palace with gardens', rating: 4.7, type: 'Palace', city: cityName, state: 'Île-de-France', country: 'France' }
    ]
  } else {
    // Generic fallback for any city
    return [
      { id: 1, name: `${cityName} City Center`, description: 'Main downtown area with shopping and dining', rating: 4.2, type: 'Urban', city: cityName, state: '', country: '' },
      { id: 2, name: `${cityName} Museum`, description: 'Local history and culture museum', rating: 4.3, type: 'Museum', city: cityName, state: '', country: '' },
      { id: 3, name: `${cityName} Central Park`, description: 'Beautiful green space for relaxation', rating: 4.1, type: 'Park', city: cityName, state: '', country: '' },
      { id: 4, name: `${cityName} Old Town`, description: 'Historic district with traditional architecture', rating: 4.4, type: 'Historical', city: cityName, state: '', country: '' },
      { id: 5, name: `${cityName} Market`, description: 'Local market for shopping and street food', rating: 4.0, type: 'Market', city: cityName, state: '', country: '' },
      { id: 6, name: `${cityName} Cathedral`, description: 'Main religious building with architectural significance', rating: 4.2, type: 'Cathedral', city: cityName, state: '', country: '' },
      { id: 7, name: `${cityName} Waterfront`, description: 'Scenic area along the water', rating: 4.3, type: 'Waterfront', city: cityName, state: '', country: '' },
      { id: 8, name: `${cityName} Cultural Center`, description: 'Hub for arts, events, and local culture', rating: 4.1, type: 'Cultural', city: cityName, state: '', country: '' }
    ]
  }
}
