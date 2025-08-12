import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let destination = ''
  let days = 3
  
  try {
    const requestBody = await request.json()
    destination = requestBody.destination || ''
    days = requestBody.days || 3

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Create a comprehensive prompt for itinerary generation
    const prompt = `Generate a detailed ${days}-day travel itinerary for "${destination}" focusing on the most trending and popular places. Return ONLY valid JSON in this exact format:

{
  "itinerary": {
    "destination": "Destination Name",
    "totalDays": ${days},
    "days": [
      {
        "day": 1,
        "title": "Day 1: Theme",
        "activities": [
          {
            "time": "09:00 AM",
            "title": "Activity Name",
            "description": "Detailed description",
            "location": "Specific location",
            "duration": "2 hours",
            "cost": "Free/₹500-1000",
            "type": "Sightseeing"
          }
        ]
      }
    ],
    "tips": [
      "Travel tip 1",
      "Travel tip 2"
    ],
    "estimatedBudget": "₹5000-8000 per person"
  }
}

Requirements:
- Include 4-6 activities per day
- Mix of trending places, cultural sites, local experiences, and food spots
- Realistic timing (9 AM - 8 PM)
- Include transportation suggestions
- Add local food recommendations
- Consider opening hours and practical logistics
- Use activity types: Sightseeing, Food, Shopping, Cultural, Adventure, Relaxation
- Cost should be in Indian Rupees (₹) with ranges
- No additional text, just the JSON.`

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
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
              }
            }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
        }

        const geminiData = await response.json()
        
        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
          throw new Error('Invalid response structure from Gemini API')
        }

        let responseText = geminiData.candidates[0].content.parts[0].text
        
        // Clean the response text
        responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim()
        
        // Remove any markdown formatting
        responseText = responseText.replace(/^```.*$/gm, '').trim()
        
        try {
          const itineraryData = JSON.parse(responseText)
          
          // Validate the response structure
          if (itineraryData.itinerary && itineraryData.itinerary.days && Array.isArray(itineraryData.itinerary.days)) {
            return NextResponse.json(itineraryData)
          } else {
            throw new Error('Invalid itinerary structure')
          }
        } catch (parseError) {
          console.error(`Attempt ${attempt} - JSON parse error:`, parseError)
          console.error('Raw response:', responseText)
          
          if (attempt === 3) {
            // If all attempts fail, return a fallback itinerary
            return NextResponse.json({
              itinerary: {
                destination: destination,
                totalDays: days,
                days: generateFallbackItinerary(destination, days),
                tips: [
                  "Plan your day early to avoid crowds",
                  "Try local cuisine for authentic experience",
                  "Carry comfortable walking shoes",
                  "Check weather conditions before heading out"
                ],
                estimatedBudget: "₹3000-6000 per person"
              }
            })
          }
          
          lastError = parseError
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error)
        lastError = error
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // If all attempts failed, return fallback
    console.error('All Gemini API attempts failed:', lastError)
    return NextResponse.json({
      itinerary: {
        destination: destination,
        totalDays: days,
        days: generateFallbackItinerary(destination, days),
        tips: [
          "Plan your day early to avoid crowds",
          "Try local cuisine for authentic experience", 
          "Carry comfortable walking shoes",
          "Check weather conditions before heading out"
        ],
        estimatedBudget: "₹3000-6000 per person"
      }
    })

  } catch (error) {
    console.error('AI Itinerary API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
      { status: 500 }
    )
  }
}

function generateFallbackItinerary(destination: string, days: number) {
  const fallbackDays = []
  
  for (let i = 1; i <= days; i++) {
    fallbackDays.push({
      day: i,
      title: `Day ${i}: Explore ${destination}`,
      activities: [
        {
          time: "09:00 AM",
          title: "Morning Exploration",
          description: `Start your day exploring the main attractions of ${destination}`,
          location: `Central ${destination}`,
          duration: "3 hours",
          cost: "₹200-500",
          type: "Sightseeing"
        },
        {
          time: "01:00 PM",
          title: "Local Lunch",
          description: "Try authentic local cuisine at popular restaurants",
          location: "Local restaurant",
          duration: "1 hour",
          cost: "₹300-600",
          type: "Food"
        },
        {
          time: "03:00 PM",
          title: "Cultural Experience",
          description: "Visit cultural sites and local markets",
          location: `${destination} cultural district`,
          duration: "2 hours",
          cost: "₹100-300",
          type: "Cultural"
        },
        {
          time: "06:00 PM",
          title: "Evening Leisure",
          description: "Relax and enjoy the evening atmosphere",
          location: "Popular evening spot",
          duration: "2 hours",
          cost: "Free",
          type: "Relaxation"
        }
      ]
    })
  }
  
  return fallbackDays
}
