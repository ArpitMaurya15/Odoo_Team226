import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@globetrotter.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@globetrotter.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create sample cities
  const cities = [
    {
      name: 'Paris',
      country: 'France',
      region: 'Europe',
      latitude: 48.8566,
      longitude: 2.3522,
      description: 'The City of Light, known for its art, culture, and cuisine.',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
      costIndex: 85.5,
      popularity: 95,
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      region: 'Asia',
      latitude: 35.6762,
      longitude: 139.6503,
      description: 'A bustling metropolis blending traditional and modern culture.',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
      costIndex: 92.3,
      popularity: 88,
    },
    {
      name: 'New York',
      country: 'United States',
      region: 'North America',
      latitude: 40.7128,
      longitude: -74.0060,
      description: 'The Big Apple, a global hub for finance, arts, and culture.',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
      costIndex: 87.8,
      popularity: 92,
    },
    {
      name: 'Barcelona',
      country: 'Spain',
      region: 'Europe',
      latitude: 41.3851,
      longitude: 2.1734,
      description: 'A vibrant city known for its architecture, beaches, and nightlife.',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
      costIndex: 65.2,
      popularity: 85,
    },
    {
      name: 'Bangkok',
      country: 'Thailand',
      region: 'Asia',
      latitude: 13.7563,
      longitude: 100.5018,
      description: 'A bustling capital known for its street food and temples.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      costIndex: 45.8,
      popularity: 78,
    },
  ]

  const createdCities = []
  for (const cityData of cities) {
    const city = await prisma.city.upsert({
      where: { name_country: { name: cityData.name, country: cityData.country } },
      update: {},
      create: cityData,
    })
    createdCities.push(city)
  }

  // Create sample activity templates
  const activityTemplates = [
    // Paris activities
    {
      name: 'Visit Eiffel Tower',
      description: 'Iconic iron lattice tower and symbol of Paris',
      category: 'SIGHTSEEING',
      duration: 120,
      averageCost: 29.0,
      cityId: createdCities[0].id,
    },
    {
      name: 'Louvre Museum Tour',
      description: 'World-famous art museum with Mona Lisa',
      category: 'CULTURE',
      duration: 180,
      averageCost: 17.0,
      cityId: createdCities[0].id,
    },
    {
      name: 'Seine River Cruise',
      description: 'Scenic boat tour along the Seine River',
      category: 'SIGHTSEEING',
      duration: 90,
      averageCost: 15.0,
      cityId: createdCities[0].id,
    },
    // Tokyo activities
    {
      name: 'Senso-ji Temple Visit',
      description: 'Ancient Buddhist temple in Asakusa',
      category: 'CULTURE',
      duration: 90,
      averageCost: 0.0,
      cityId: createdCities[1].id,
    },
    {
      name: 'Tsukiji Fish Market',
      description: 'Famous fish market with fresh sushi',
      category: 'FOOD',
      duration: 120,
      averageCost: 25.0,
      cityId: createdCities[1].id,
    },
    {
      name: 'Tokyo Skytree',
      description: 'Tallest tower in Japan with panoramic views',
      category: 'SIGHTSEEING',
      duration: 90,
      averageCost: 20.0,
      cityId: createdCities[1].id,
    },
  ]

  for (const templateData of activityTemplates) {
    try {
      await prisma.activityTemplate.create({
        data: templateData,
      })
    } catch (error) {
      // Skip if already exists
      console.log(`Activity template ${templateData.name} already exists`)
    }
  }

  // Create sample trip for user1
  const trip = await prisma.trip.create({
    data: {
      name: 'European Adventure',
      description: 'A wonderful journey through Europe',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-15'),
      totalBudget: 400000.0, // ₹4,00,000 (equivalent to ~$5000)
      userId: user1.id,
      isPublic: true,
      publicSlug: 'european-adventure-2024',
    },
  })

  // Create stops for the trip
  const stop1 = await prisma.stop.create({
    data: {
      tripId: trip.id,
      cityId: createdCities[0].id, // Paris
      order: 1,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-07'),
    },
  })

  const stop2 = await prisma.stop.create({
    data: {
      tripId: trip.id,
      cityId: createdCities[3].id, // Barcelona
      order: 2,
      startDate: new Date('2024-06-08'),
      endDate: new Date('2024-06-15'),
    },
  })

  // Create sample activities
  await prisma.activity.createMany({
    data: [
      {
        tripId: trip.id,
        stopId: stop1.id,
        name: 'Visit Eiffel Tower',
        category: 'SIGHTSEEING',
        startTime: new Date('2024-06-02T10:00:00'),
        endTime: new Date('2024-06-02T12:00:00'),
        cost: 29.0,
        order: 1,
      },
      {
        tripId: trip.id,
        stopId: stop1.id,
        name: 'Louvre Museum',
        category: 'CULTURE',
        startTime: new Date('2024-06-03T14:00:00'),
        endTime: new Date('2024-06-03T17:00:00'),
        cost: 17.0,
        order: 2,
      },
    ],
  })

  // Create sample expenses
  await prisma.expense.createMany({
    data: [
      {
        tripId: trip.id,
        category: 'TRANSPORTATION',
        amount: 450.0,
        description: 'Flight tickets',
        date: new Date('2024-05-15'),
      },
      {
        tripId: trip.id,
        category: 'ACCOMMODATION',
        amount: 1200.0,
        description: 'Hotel bookings',
        date: new Date('2024-05-20'),
      },
      {
        tripId: trip.id,
        category: 'FOOD',
        amount: 300.0,
        description: 'Restaurant meals',
        date: new Date('2024-06-02'),
      },
    ],
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
