import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json()

    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 })
    }

    // Try to get restaurants from Gemini API
    try {
      const prompt = `Generate a JSON list of 12 trending restaurants in ${location}. Include diverse cuisine types (Italian, Japanese, Local, International, Indian, Seafood, Chinese, Mexican, French, Thai, American, Vegetarian). For each restaurant, provide: name, cuisine, rating (4.0-5.0), priceRange ($, $$, $$$, $$$$), description, and 3 specialties. Make them realistic and appealing.

Format as:
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type",
      "rating": 4.5,
      "priceRange": "$$",
      "location": "${location}",
      "description": "Brief description",
      "specialties": ["Specialty1", "Specialty2", "Specialty3"]
    }
  ]
}`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (rawText) {
          console.log('Raw Gemini response:', rawText)
          
          // Extract JSON from the response
          const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}/)
          
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0]
            const parsedData = JSON.parse(jsonStr)
            
            if (parsedData.restaurants && Array.isArray(parsedData.restaurants)) {
              // Add IDs to restaurants
              const restaurantsWithIds = parsedData.restaurants.map((restaurant: any, index: number) => ({
                ...restaurant,
                id: index + 1,
                location: location
              }))
              
              return NextResponse.json({ restaurants: restaurantsWithIds })
            }
          }
        }
      }
      
      // If Gemini fails, throw error to use fallback
      throw new Error('Gemini API failed')
      
    } catch (error) {
      console.error('Gemini API error:', error)
      
      // Fallback to mock restaurant data with location-aware names
      const mockRestaurants = [
        {
          id: 1,
          name: 'The Golden Spoon',
          cuisine: 'Italian',
          rating: 4.8,
          priceRange: '$$$',
          location: location,
          description: 'Authentic Italian cuisine with a modern twist',
          specialties: ['Pasta', 'Pizza', 'Wine']
        },
        {
          id: 2,
          name: 'Sakura Sushi',
          cuisine: 'Japanese',
          rating: 4.7,
          priceRange: '$$',
          location: location,
          description: 'Fresh sushi and traditional Japanese dishes',
          specialties: ['Sushi', 'Ramen', 'Tempura']
        },
        {
          id: 3,
          name: 'Street Food Paradise',
          cuisine: 'Local',
          rating: 4.6,
          priceRange: '$',
          location: location,
          description: 'Best local street food and traditional flavors',
          specialties: ['Street Food', 'Local Cuisine', 'Spicy']
        },
        {
          id: 4,
          name: 'Rooftop Bistro',
          cuisine: 'International',
          rating: 4.9,
          priceRange: '$$$$',
          location: location,
          description: 'Fine dining with panoramic city views',
          specialties: ['Fine Dining', 'City Views', 'Cocktails']
        },
        {
          id: 5,
          name: 'Spice Garden',
          cuisine: 'Indian',
          rating: 4.5,
          priceRange: '$$',
          location: location,
          description: 'Authentic Indian spices and traditional recipes',
          specialties: ['Curry', 'Biryani', 'Vegetarian']
        },
        {
          id: 6,
          name: 'Ocean Breeze Cafe',
          cuisine: 'Seafood',
          rating: 4.4,
          priceRange: '$$$',
          location: location,
          description: 'Fresh seafood with ocean views',
          specialties: ['Seafood', 'Ocean View', 'Fresh Fish']
        },
        {
          id: 7,
          name: 'Dragon Palace',
          cuisine: 'Chinese',
          rating: 4.6,
          priceRange: '$$',
          location: location,
          description: 'Traditional Chinese dishes with modern presentation',
          specialties: ['Dim Sum', 'Peking Duck', 'Hot Pot']
        },
        {
          id: 8,
          name: 'Casa Mexico',
          cuisine: 'Mexican',
          rating: 4.3,
          priceRange: '$$',
          location: location,
          description: 'Vibrant Mexican flavors and fresh ingredients',
          specialties: ['Tacos', 'Guacamole', 'Margaritas']
        },
        {
          id: 9,
          name: 'Le Petit Bistro',
          cuisine: 'French',
          rating: 4.7,
          priceRange: '$$$',
          location: location,
          description: 'Classic French cuisine in an intimate setting',
          specialties: ['Croissants', 'Wine Selection', 'Cheese']
        },
        {
          id: 10,
          name: 'Bangkok Street',
          cuisine: 'Thai',
          rating: 4.5,
          priceRange: '$$',
          location: location,
          description: 'Authentic Thai street food experience',
          specialties: ['Pad Thai', 'Tom Yum', 'Green Curry']
        },
        {
          id: 11,
          name: 'The Burger Joint',
          cuisine: 'American',
          rating: 4.2,
          priceRange: '$$',
          location: location,
          description: 'Gourmet burgers and craft beer selection',
          specialties: ['Burgers', 'Fries', 'Craft Beer']
        },
        {
          id: 12,
          name: 'Garden Vegetarian',
          cuisine: 'Vegetarian',
          rating: 4.4,
          priceRange: '$$',
          location: location,
          description: 'Fresh, healthy vegetarian and vegan options',
          specialties: ['Salads', 'Smoothies', 'Plant-based']
        }
      ]
      
      return NextResponse.json({ 
        restaurants: mockRestaurants,
        error: 'AI service busy - showing curated suggestions'
      })
    }

  } catch (error) {
    console.error('Error in restaurants API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}
