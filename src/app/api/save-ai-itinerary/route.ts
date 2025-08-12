import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { itinerary, tripId } = await request.json()

    if (!itinerary || !itinerary.destination || !itinerary.days) {
      return NextResponse.json(
        { error: 'Invalid itinerary data' },
        { status: 400 }
      )
    }

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    // Find or create the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find and verify the existing trip
    const trip = await prisma.trip.findUnique({
      where: { 
        id: tripId 
      },
      include: {
        user: true
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Verify the user owns this trip
    if (trip.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this trip' },
        { status: 403 }
      )
    }

    // Update trip with AI itinerary information
    const totalActivities = itinerary.days.reduce((total: number, day: any) => total + day.activities.length, 0)
    
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        name: `${itinerary.destination} - ${itinerary.totalDays} Days AI Enhanced`,
        description: `${trip.description || ''}\n\nAI-generated ${itinerary.totalDays}-day itinerary for ${itinerary.destination} with ${totalActivities} places to visit`,
        // Extract budget number from string like "₹5000-8000 per person"
        totalBudget: extractBudgetAmount(itinerary.estimatedBudget) || trip.totalBudget,
      }
    })

    // Find or create cities for each unique location in the itinerary
    const locationCityMap = new Map()
    
    // First, collect all unique locations and create cities for them
    for (const day of itinerary.days) {
      for (const activity of day.activities) {
        const locationName = extractLocationName(activity.location)
        
        if (!locationCityMap.has(locationName)) {
          // Try to find existing city first
          let city = await prisma.city.findFirst({
            where: {
              name: locationName
            }
          })

          if (!city) {
            // Create a new city for this location
            city = await prisma.city.create({
              data: {
                name: locationName,
                country: 'Unknown',
                latitude: 0,
                longitude: 0,
                description: `Location in ${itinerary.destination}`
              }
            })
          }

          locationCityMap.set(locationName, city)
        }
      }
    }

    // Get the next available order number for stops
    const lastStop = await prisma.stop.findFirst({
      where: { tripId: trip.id },
      orderBy: { order: 'desc' }
    })
    
    let stopOrder = (lastStop?.order || 0) + 1
    
    // Use trip start date as base, or current date if no start date
    const baseDate = trip.startDate ? new Date(trip.startDate) : new Date()
    
    for (let dayIndex = 0; dayIndex < itinerary.days.length; dayIndex++) {
      const day = itinerary.days[dayIndex]
      const stopDate = new Date(baseDate)
      stopDate.setDate(baseDate.getDate() + dayIndex)

      // Create a stop for each activity (place)
      for (let actIndex = 0; actIndex < day.activities.length; actIndex++) {
        const activity = day.activities[actIndex]
        const locationName = extractLocationName(activity.location)
        const city = locationCityMap.get(locationName)
        
        // Parse time and create activity datetime
        const activityDateTime = parseActivityTime(activity.time, stopDate)
        
        // Create a stop for this place/location
        const stop = await prisma.stop.create({
          data: {
            tripId: trip.id,
            cityId: city.id,
            order: stopOrder++,
            startDate: activityDateTime,
            endDate: activityDateTime
          }
        })

        // Create the activity for this stop
        await prisma.activity.create({
          data: {
            tripId: trip.id,
            stopId: stop.id,
            name: activity.title,
            description: activity.description,
            category: mapActivityType(activity.type),
            startTime: activityDateTime,
            cost: extractCostAmount(activity.cost),
            order: 1, // Each stop has one main activity
            notes: `Location: ${activity.location}\nDuration: ${activity.duration}`
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      tripId: trip.id,
      message: 'AI itinerary added successfully to your trip!'
    })

  } catch (error) {
    console.error('Error saving AI itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to save itinerary' },
      { status: 500 }
    )
  }
}

// Helper functions
function extractBudgetAmount(budgetString: string): number | null {
  if (!budgetString) return null
  
  // Extract numbers from strings like "₹5000-8000 per person"
  const numbers = budgetString.match(/₹?(\d+)/g)
  if (numbers && numbers.length > 0) {
    const firstNumber = numbers[0].replace('₹', '')
    return parseFloat(firstNumber)
  }
  
  return null
}

function extractLocationName(location: string): string {
  // Clean and extract meaningful location name
  if (!location) return 'Unknown Location'
  
  // Remove common prefixes and clean the location
  let cleanLocation = location
    .replace(/^(Visit|Go to|Explore|See)\s+/i, '')
    .trim()
  
  // If location contains comma, take the first part (usually the main place)
  if (cleanLocation.includes(',')) {
    cleanLocation = cleanLocation.split(',')[0].trim()
  }
  
  // If location is too generic, use a more specific name
  if (cleanLocation.toLowerCase().includes('central') || 
      cleanLocation.toLowerCase().includes('main') ||
      cleanLocation.length < 3) {
    return location // Return original if too generic
  }
  
  return cleanLocation
}

function parseActivityTime(timeString: string, baseDate: Date): Date {
  const activityDate = new Date(baseDate)
  
  try {
    // Parse time strings like "09:00 AM", "01:00 PM"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[2])
      const period = timeMatch[3].toUpperCase()
      
      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }
      
      activityDate.setHours(hours, minutes, 0, 0)
    }
  } catch (error) {
    // If parsing fails, just use the base date
    console.error('Error parsing time:', timeString, error)
  }
  
  return activityDate
}

function mapActivityType(type: string): 'SIGHTSEEING' | 'FOOD' | 'ENTERTAINMENT' | 'ADVENTURE' | 'CULTURE' | 'SHOPPING' | 'RELAXATION' | 'TRANSPORTATION' | 'ACCOMMODATION' | 'OTHER' {
  const typeMap: { [key: string]: 'SIGHTSEEING' | 'FOOD' | 'ENTERTAINMENT' | 'ADVENTURE' | 'CULTURE' | 'SHOPPING' | 'RELAXATION' | 'TRANSPORTATION' | 'ACCOMMODATION' | 'OTHER' } = {
    'Sightseeing': 'SIGHTSEEING',
    'Food': 'FOOD',
    'Cultural': 'CULTURE',
    'Adventure': 'ADVENTURE',
    'Shopping': 'SHOPPING',
    'Relaxation': 'RELAXATION',
    'Entertainment': 'ENTERTAINMENT'
  }
  
  return typeMap[type] || 'OTHER'
}

function extractCostAmount(costString: string): number | null {
  if (!costString || costString.toLowerCase() === 'free') return 0
  
  // Extract numbers from strings like "₹500-1000", "₹300"
  const numbers = costString.match(/₹?(\d+)/g)
  if (numbers && numbers.length > 0) {
    const firstNumber = numbers[0].replace('₹', '')
    return parseFloat(firstNumber)
  }
  
  return null
}
