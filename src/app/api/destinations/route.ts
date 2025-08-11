import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let country = ''
  
  try {
    const requestBody = await request.json()
    country = requestBody.country || ''

    if (!country) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Simple and focused prompt
    const prompt = `Generate exactly 6 popular tourist destinations for "${country}". Return ONLY valid JSON in this exact format:

{
  "destinations": [
    {
      "name": "Destination Name",
      "city": "City Name", 
      "state": "State/Province Name",
      "country": "Country Name",
      "rating": 4.5,
      "type": "Cultural"
    }
  ]
}

Use these types only: Cultural, Beach, Adventure, Nature, Urban, Historical
Ratings must be between 4.0-5.0
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
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 1024,
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

        const generatedText = data.candidates[0].content.parts[0].text.trim()
        console.log('Raw Gemini response:', generatedText)
        
        // Clean up the response text to extract JSON
        let jsonText = generatedText
        
        // Remove any markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        
        // Try to parse the JSON
        let parsedData
        try {
          parsedData = JSON.parse(jsonText)
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          console.error('Failed to parse text:', jsonText)
          
          // Try to extract JSON from the text using regex
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[0])
            } catch (secondParseError) {
              throw new Error('Could not parse JSON from Gemini response')
            }
          } else {
            throw new Error('No valid JSON found in Gemini response')
          }
        }

        // Validate the structure
        if (!parsedData.destinations || !Array.isArray(parsedData.destinations)) {
          throw new Error('Invalid destinations format from Gemini API')
        }

        // Add IDs to destinations and ensure they have all required fields
        const destinationsWithIds = parsedData.destinations.slice(0, 6).map((dest: any, index: number) => ({
          id: index + 1,
          name: dest.name || 'Unknown Destination',
          city: dest.city || 'Unknown City',
          state: dest.state || 'Unknown State',
          country: dest.country || country,
          rating: Math.min(Math.max(dest.rating || 4.5, 4.0), 5.0),
          type: dest.type || 'Cultural'
        }))

        return NextResponse.json({
          destinations: destinationsWithIds
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
    console.error('Error fetching destinations:', error)
    
    // Return enhanced fallback data based on search query
    const fallbackDestinations = getFallbackDestinations(country)

    return NextResponse.json({
      destinations: fallbackDestinations,
      error: 'Used fallback data due to API error'
    })
  }
}

function getFallbackDestinations(searchQuery: string): any[] {
  const query = searchQuery.toLowerCase()
  
  // Enhanced fallback destinations with real images based on search query
  if (query.includes('india')) {
    return [
      { 
        id: 1, 
        name: 'Taj Mahal', 
        city: 'Agra', 
        state: 'Uttar Pradesh', 
        country: 'India', 
        rating: 4.8, 
        type: 'Historical',
        imageUrl: 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 2, 
        name: 'Goa Beaches', 
        city: 'Panaji', 
        state: 'Goa', 
        country: 'India', 
        rating: 4.6, 
        type: 'Beach',
        imageUrl: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 3, 
        name: 'Kerala Backwaters', 
        city: 'Alleppey', 
        state: 'Kerala', 
        country: 'India', 
        rating: 4.7, 
        type: 'Nature',
        imageUrl: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 4, 
        name: 'Golden Temple', 
        city: 'Amritsar', 
        state: 'Punjab', 
        country: 'India', 
        rating: 4.9, 
        type: 'Cultural',
        imageUrl: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 5, 
        name: 'Himalayas', 
        city: 'Manali', 
        state: 'Himachal Pradesh', 
        country: 'India', 
        rating: 4.8, 
        type: 'Adventure',
        imageUrl: 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 6, 
        name: 'Mumbai', 
        city: 'Mumbai', 
        state: 'Maharashtra', 
        country: 'India', 
        rating: 4.4, 
        type: 'Urban',
        imageUrl: 'https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      }
    ]
  } else if (query.includes('japan')) {
    return [
      { 
        id: 1, 
        name: 'Tokyo', 
        city: 'Tokyo', 
        state: 'Tokyo', 
        country: 'Japan', 
        rating: 4.8, 
        type: 'Urban',
        imageUrl: 'https://images.pexels.com/photos/315191/pexels-photo-315191.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 2, 
        name: 'Kyoto Temples', 
        city: 'Kyoto', 
        state: 'Kyoto', 
        country: 'Japan', 
        rating: 4.9, 
        type: 'Cultural',
        imageUrl: 'https://images.pexels.com/photos/161401/fushimi-inari-taisha-shrine-kyoto-japan-161401.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 3, 
        name: 'Mount Fuji', 
        city: 'Fujiyoshida', 
        state: 'Yamanashi', 
        country: 'Japan', 
        rating: 4.7, 
        type: 'Nature',
        imageUrl: 'https://images.pexels.com/photos/46253/mt-fuji-sea-of-clouds-sunrise-46253.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 4, 
        name: 'Osaka Castle', 
        city: 'Osaka', 
        state: 'Osaka', 
        country: 'Japan', 
        rating: 4.6, 
        type: 'Historical',
        imageUrl: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 5, 
        name: 'Hiroshima', 
        city: 'Hiroshima', 
        state: 'Hiroshima', 
        country: 'Japan', 
        rating: 4.5, 
        type: 'Historical',
        imageUrl: 'https://images.pexels.com/photos/5137986/pexels-photo-5137986.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 6, 
        name: 'Nara Deer Park', 
        city: 'Nara', 
        state: 'Nara', 
        country: 'Japan', 
        rating: 4.8, 
        type: 'Nature',
        imageUrl: 'https://images.pexels.com/photos/12567/photo-1463780324318-d363dcafd4b2.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      }
    ]
  } else {
    return [
      { 
        id: 1, 
        name: 'Tokyo', 
        city: 'Tokyo', 
        state: 'Tokyo', 
        country: 'Japan', 
        rating: 4.8, 
        type: 'Cultural',
        imageUrl: 'https://images.pexels.com/photos/315191/pexels-photo-315191.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 2, 
        name: 'Santorini', 
        city: 'Santorini', 
        state: 'South Aegean', 
        country: 'Greece', 
        rating: 4.9, 
        type: 'Beach',
        imageUrl: 'https://images.pexels.com/photos/161901/santorini-oia-greece-water-161901.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 3, 
        name: 'Paris', 
        city: 'Paris', 
        state: 'Île-de-France', 
        country: 'France', 
        rating: 4.6, 
        type: 'Cultural',
        imageUrl: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 4, 
        name: 'Bali', 
        city: 'Denpasar', 
        state: 'Bali', 
        country: 'Indonesia', 
        rating: 4.7, 
        type: 'Beach',
        imageUrl: 'https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 5, 
        name: 'New York', 
        city: 'New York', 
        state: 'New York', 
        country: 'USA', 
        rating: 4.5, 
        type: 'Urban',
        imageUrl: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      },
      { 
        id: 6, 
        name: 'Swiss Alps', 
        city: 'Interlaken', 
        state: 'Bern', 
        country: 'Switzerland', 
        rating: 4.9, 
        type: 'Adventure',
        imageUrl: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
      }
    ]
  }
}
