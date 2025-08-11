export interface User {
  id: string
  name?: string | null
  email: string
  emailVerified?: Date | null
  image?: string | null
  password?: string | null
  role: 'USER' | 'ADMIN'
  preferences?: any
  createdAt: Date
  updatedAt: Date
}

export interface Trip {
  id: string
  name: string
  description?: string | null
  startDate: Date
  endDate: Date
  coverImage?: string | null
  isPublic: boolean
  publicSlug?: string | null
  totalBudget?: number | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface City {
  id: string
  name: string
  country: string
  region?: string | null
  latitude: number
  longitude: number
  description?: string | null
  image?: string | null
  costIndex?: number | null
  popularity: number
  createdAt: Date
  updatedAt: Date
}

export interface Stop {
  id: string
  tripId: string
  cityId: string
  order: number
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  tripId: string
  stopId?: string | null
  templateId?: string | null
  name: string
  description?: string | null
  category: ActivityCategory
  startTime?: Date | null
  endTime?: Date | null
  cost?: number | null
  order: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ActivityTemplate {
  id: string
  name: string
  description?: string | null
  category: ActivityCategory
  duration?: number | null
  averageCost?: number | null
  image?: string | null
  cityId: string
  createdAt: Date
  updatedAt: Date
}

export interface Expense {
  id: string
  tripId: string
  category: ExpenseCategory
  amount: number
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export type ActivityCategory = 
  | 'SIGHTSEEING'
  | 'FOOD'
  | 'ENTERTAINMENT'
  | 'ADVENTURE'
  | 'CULTURE'
  | 'SHOPPING'
  | 'RELAXATION'
  | 'TRANSPORTATION'
  | 'ACCOMMODATION'
  | 'OTHER'

export type ExpenseCategory = 
  | 'TRANSPORTATION'
  | 'ACCOMMODATION'
  | 'FOOD'
  | 'ACTIVITIES'
  | 'SHOPPING'
  | 'OTHER'

export type Role = 'USER' | 'ADMIN'

export type TripWithDetails = Trip & {
  stops: (Stop & {
    city: City
    activities: Activity[]
  })[]
  activities: Activity[]
}
