'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Users, TrendingUp, Star, Clock, ThermometerSun, Navigation, Search, Filter, ArrowUpDown, Plus, ChevronDown } from 'lucide-react'

// Component for loading destination images
function DestinationImage({ destination }: { destination: any }) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Always search for images based on destination name and location
        // This ensures Gemini-generated destinations get relevant images from Pexels
        const searchParams = new URLSearchParams({
          q: destination.name
        })
        
        // Add location information for more accurate image search
        if (destination.city) searchParams.append('city', destination.city)
        if (destination.state) searchParams.append('state', destination.state)
        if (destination.country) searchParams.append('country', destination.country)
        
        const response = await fetch(`/api/images?${searchParams.toString()}`)
        const data = await response.json()
        
        if (data.imageUrl) {
          setImageUrl(data.imageUrl)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to load image:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadImage()
  }, [destination.name, destination.city, destination.state, destination.country])

  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-blue-600">Loading image...</span>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <svg className="h-16 w-16 text-white opacity-70" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    )
  }

  return (
    <img 
      src={imageUrl}
      alt={`${destination.name} in ${destination.city}, ${destination.country}`}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setError(true)}
    />
  )
}

// Helper functions for restaurant display
function getCuisineEmoji(cuisine: string): string {
  const emojiMap: { [key: string]: string } = {
    'Italian': '🍝',
    'Japanese': '🍣',
    'Local': '🥘',
    'International': '🏙️',
    'Indian': '🌶️',
    'Seafood': '🐟',
    'Chinese': '🥢',
    'Mexican': '🌮',
    'French': '🥐',
    'Thai': '🍜',
    'American': '🍔',
    'Vegetarian': '🥗'
  }
  return emojiMap[cuisine] || '🍽️'
}

function getRestaurantImage(cuisine: string): string {
  const imageMap: { [key: string]: string } = {
    'Italian': 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
    'Japanese': 'https://images.pexels.com/photos/357573/pexels-photo-357573.jpeg',
    'Local': 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg',
    'International': 'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg',
    'Indian': 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
    'Seafood': 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    'Chinese': 'https://images.pexels.com/photos/2641886/pexels-photo-2641886.jpeg',
    'Mexican': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    'French': 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg',
    'Thai': 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
    'American': 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg',
    'Vegetarian': 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg'
  }
  return imageMap[cuisine] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg'
}

function getSpecialtyColor(index: number): string {
  const colors = [
    'bg-orange-100 text-orange-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800'
  ]
  return colors[index % colors.length]
}

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [sortBy, setSortBy] = useState('rating-desc')
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [destinations, setDestinations] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [restaurantsToShow, setRestaurantsToShow] = useState(6) // Show 6 restaurants initially
  const [loading, setLoading] = useState(false)
  const [restaurantsLoading, setRestaurantsLoading] = useState(false)
  const [error, setError] = useState('')
  const [restaurantsError, setRestaurantsError] = useState('')

  // Fetch destinations from Gemini API
  const fetchDestinations = async (searchInput: string) => {
    if (!searchInput.trim()) return
    
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/destinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: searchInput.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (data.destinations && Array.isArray(data.destinations)) {
        setDestinations(data.destinations)
        
        // Also fetch restaurants for the same location
        fetchRestaurants(searchInput.trim())
        
        // Show a more user-friendly message if fallback data was used
        if (data.error) {
          setError('✨ AI service is busy - showing curated suggestions instead')
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching destinations:', err)
      
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('🌐 Network error - please check your connection and try again')
        } else if (err.message.includes('AI service is busy')) {
          setError('✨ AI service is busy - showing curated suggestions instead')
        } else {
          setError('⚠️ Unable to load fresh suggestions - showing popular destinations')
        }
      } else {
        setError('❌ Unexpected error occurred')
      }
      
      // Enhanced fallback destinations
      setDestinations([
        { id: 1, name: 'Tokyo', city: 'Tokyo', state: 'Tokyo', country: 'Japan', rating: 4.8, type: 'Cultural' },
        { id: 2, name: 'Santorini', city: 'Santorini', state: 'South Aegean', country: 'Greece', rating: 4.9, type: 'Beach' },
        { id: 3, name: 'Paris', city: 'Paris', state: 'Île-de-France', country: 'France', rating: 4.6, type: 'Cultural' },
        { id: 4, name: 'Bali', city: 'Denpasar', state: 'Bali', country: 'Indonesia', rating: 4.7, type: 'Beach' },
        { id: 5, name: 'New York', city: 'New York', state: 'New York', country: 'USA', rating: 4.5, type: 'Urban' },
        { id: 6, name: 'Swiss Alps', city: 'Interlaken', state: 'Bern', country: 'Switzerland', rating: 4.9, type: 'Adventure' }
      ])
      
      // Also load fallback restaurants
      fetchRestaurants('Popular')
    } finally {
      setLoading(false)
    }
  }

  // Fetch restaurants for the selected location
  const fetchRestaurants = async (location: string) => {
    try {
      setRestaurantsLoading(true)
      setRestaurantsError('')
      setRestaurantsToShow(6) // Reset to show 6 restaurants initially
      
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: location }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurants')
      }

      if (data.restaurants && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants)
        
        // Show a more user-friendly message if fallback data was used
        if (data.error) {
          setRestaurantsError('✨ AI service is busy - showing curated restaurant suggestions instead')
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err)
      
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setRestaurantsError('🌐 Network error - please check your connection and try again')
        } else if (err.message.includes('AI service busy')) {
          setRestaurantsError('✨ AI service is busy - showing curated restaurant suggestions instead')
        } else {
          setRestaurantsError('⚠️ Unable to load fresh restaurant suggestions - showing popular restaurants')
        }
      } else {
        setRestaurantsError('❌ Unexpected error occurred')
      }
      
      // Fallback restaurants
      setRestaurants([
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
        }
      ])
    } finally {
      setRestaurantsLoading(false)
    }
  }

  // Load initial destinations for India
  useEffect(() => {
    fetchDestinations('India')
  }, [])

  // Handle search input with debouncing
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        fetchDestinations(searchQuery)
      }, 1000) // 1 second delay

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery])

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (session?.user?.role === 'ADMIN') {
      return '/admin'
    }
    return '/dashboard'
  }

  // Get dashboard button text based on user role
  const getDashboardButtonText = () => {
    if (session?.user?.role === 'ADMIN') {
      return 'Go to Admin Panel'
    }
    return 'Go to Dashboard'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null)
    }

    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  // Load initial data
  useEffect(() => {
    fetchDestinations('India') // This will also fetch restaurants
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) return
    
    const timeoutId = setTimeout(() => {
      fetchDestinations(searchQuery)
    }, 1000) // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Get unique values for filters
  const countries = Array.from(new Set(destinations.map(d => d.country))).sort()
  const states = Array.from(new Set(destinations.filter(d => !selectedCountry || d.country === selectedCountry).map(d => d.state))).sort()
  const cities = Array.from(new Set(destinations.filter(d => (!selectedCountry || d.country === selectedCountry) && (!selectedState || d.state === selectedState)).map(d => d.city))).sort()

  // Filter and sort destinations
  const filteredDestinations = destinations
    .filter(destination => {
      const matchesSearch = destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          destination.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          destination.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          destination.country.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCountry = !selectedCountry || destination.country === selectedCountry
      const matchesState = !selectedState || destination.state === selectedState
      const matchesCity = !selectedCity || destination.city === selectedCity
      
      return matchesSearch && matchesCountry && matchesState && matchesCity
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'rating-asc':
          return a.rating - b.rating
        case 'rating-desc':
          return b.rating - a.rating
        default:
          return 0
      }
    })

  return (
    // Homepage component with default styling
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <MapPin className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">GlobeTrotter</span>
          </Link>
          <div className="space-x-4">
            {status === 'loading' ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <Link href={getDashboardUrl()}>
                <Button>{getDashboardButtonText()}</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Banner */}
        <div className="relative h-96 bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/banner.jpg')"}}>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
            <div className="text-center space-y-6 text-white">
              <h1 className="text-5xl font-bold">
                Plan Your Perfect Trip with{' '}
                <span className="text-blue-400">Intelligence</span>
              </h1>
              <p className="text-xl max-w-3xl mx-auto">
                GlobeTrotter combines smart recommendations, collaborative planning, and budget tracking 
                to make your travel planning effortless and enjoyable.
              </p>
              <div className="flex justify-center">
                {session ? (
                  <Link href={getDashboardUrl()}>
                    <Button size="lg" className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700">
                      {getDashboardButtonText()}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup">
                    <Button size="lg" className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700">
                      Start Planning
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-16">
          {/* Real-time City Recommendations */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-8">Discover Trending Destinations</h2>
            
          {/* Search and Filter Section */}
          <div className="mb-16">
            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search Bar */}
                <div className="lg:col-span-2">
                  <Label htmlFor="search">🤖 AI-Powered Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Enter country or region (e.g., India, Japan, Europe)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {loading ? 'Generating destinations...' : 'AI will generate trending places as you type'}
                  </p>
                </div>

                {/* Country Filter */}
                <div>
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value)
                      setSelectedState('')
                      setSelectedCity('')
                    }}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Countries</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* State Filter */}
                <div>
                  <Label htmlFor="state">State/Region</Label>
                  <select
                    id="state"
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setSelectedCity('')
                    }}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedCountry}
                  >
                    <option value="">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div>
                  <Label htmlFor="city">City</Label>
                  <select
                    id="city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedState}
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="rating-asc">Rating (Low to High)</option>
                      <option value="rating-desc">Rating (High to Low)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCountry('')
                    setSelectedState('')
                    setSelectedCity('')
                    setSortBy('rating-desc')
                    setRestaurantsToShow(6) // Reset restaurants display count
                    fetchDestinations('India') // Reset to default India destinations (also fetches restaurants)
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <div className="h-12 w-12 bg-gray-300 rounded"></div>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))
              ) : error ? (
                // Show sample destinations instead of error message
                filteredDestinations.map((destination) => (
                  <Card key={destination.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 relative">
                    {/* Destination Photo */}
                    <div className="h-48 relative overflow-hidden">
                      <DestinationImage destination={destination} />
                      <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center space-x-2">
                            <span>📍</span>
                            <span className="truncate">{destination.name}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{destination.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            destination.type === 'Cultural' ? 'bg-purple-100 text-purple-800' :
                            destination.type === 'Beach' ? 'bg-blue-100 text-blue-800' :
                            destination.type === 'Urban' ? 'bg-gray-100 text-gray-800' :
                            destination.type === 'Adventure' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {destination.type}
                          </span>
                        </div>
                      </div>
                      <CardDescription className="text-sm text-gray-600 flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{destination.city}, {destination.state}, {destination.country}</span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                        {destination.type === 'Cultural' && 'Immerse yourself in rich history, stunning architecture, and vibrant local traditions.'}
                        {destination.type === 'Beach' && 'Relax on pristine beaches with crystal-clear waters and breathtaking sunsets.'}
                        {destination.type === 'Urban' && 'Experience the energy of city life with world-class dining, shopping, and entertainment.'}
                        {destination.type === 'Adventure' && 'Challenge yourself with outdoor activities and breathtaking natural landscapes.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>✨ Curated recommendation</span>
                        <Button 
                          size="sm" 
                          className="h-7 px-3"
                          onClick={() => {
                            setSearchQuery(destination.name)
                            fetchRestaurants(destination.name)
                          }}
                        >
                          Explore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredDestinations.length > 0 ? (
                filteredDestinations.map((destination) => (
                  <Card key={destination.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 relative">
                    {/* Destination Photo */}
                    <div className="h-48 relative overflow-hidden">
                      <DestinationImage destination={destination} />
                      <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center space-x-2">
                            <span>📍</span>
                            <span className="truncate">{destination.name}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{destination.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-blue-600 font-medium">{destination.type}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm truncate">
                        {destination.city}, {destination.state}, {destination.country}
                      </CardDescription>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{destination.country}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{destination.type}</span>
                      </div>
                      
                      {/* Add to Trip Button */}
                      <div className="mt-4 relative">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdown(openDropdown === destination.id ? null : destination.id)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Trip
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === destination.id && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle add as new trip
                                  if (session) {
                                    window.location.href = `/trips/create?destination=${encodeURIComponent(destination.name)}&city=${encodeURIComponent(destination.city)}&state=${encodeURIComponent(destination.state)}&country=${encodeURIComponent(destination.country)}`
                                  } else {
                                    window.location.href = '/auth/signin'
                                  }
                                  setOpenDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="h-4 w-4 inline mr-2" />
                                Add as New Trip
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle add to existing trip
                                  if (session) {
                                    alert(`Add ${destination.name} to existing trip feature coming soon!`)
                                  } else {
                                    window.location.href = '/auth/signin'
                                  }
                                  setOpenDropdown(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Calendar className="h-4 w-4 inline mr-2" />
                                Add to Existing Trip
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No destinations found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trending Restaurants Section */}
        <div className="container mx-auto px-4 py-16 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4">🤖 AI-Powered Restaurant Discovery</h2>
            {searchQuery && (
              <p className="text-center text-gray-600 mb-4">
                Showing AI-generated restaurants in: <span className="font-semibold text-orange-600">{searchQuery}</span>
              </p>
            )}
            {restaurantsError && (
              <div className="text-center mb-6">
                <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 inline-block">
                  {restaurantsError}
                </p>
              </div>
            )}
            
            {/* Restaurants Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurantsLoading ? (
                // Loading skeleton for restaurants
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardHeader className="pb-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                      <div className="flex gap-2 mb-3">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : restaurantsError ? (
                // Show sample restaurants instead of error message
                restaurants.slice(0, restaurantsToShow).map((restaurant) => (
                  <Card key={restaurant.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 overflow-hidden">
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={getRestaurantImage(restaurant.cuisine)}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
                        {restaurant.priceRange}
                      </div>
                      <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <span>{getCuisineEmoji(restaurant.cuisine)}</span>
                        <span>{restaurant.cuisine}</span>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{restaurant.name}</h3>
                        <div className="flex items-center space-x-1 text-yellow-500 ml-2 flex-shrink-0">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs font-medium text-gray-700">{restaurant.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{restaurant.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.specialties.slice(0, 3).map((specialty: string, index: number) => (
                          <span 
                            key={specialty} 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecialtyColor(index)}`}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : restaurants.length > 0 ? (
                restaurants.slice(0, restaurantsToShow).map((restaurant) => (
                  <Card key={restaurant.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 overflow-hidden">
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={getRestaurantImage(restaurant.cuisine)}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
                        {restaurant.priceRange}
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center space-x-2">
                            <span>{getCuisineEmoji(restaurant.cuisine)}</span>
                            <span className="truncate">{restaurant.name}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{restaurant.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-orange-600 font-medium">{restaurant.cuisine}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {restaurant.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {restaurant.specialties?.slice(0, 3).map((specialty: string, index: number) => (
                          <span key={index} className={`px-2 py-1 text-xs rounded-full ${getSpecialtyColor(index)}`}>
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // Create Google Maps search URL for the restaurant
                          const query = encodeURIComponent(`${restaurant.name} ${restaurant.location}`)
                          const mapsUrl = `https://www.google.com/maps/search/${query}`
                          window.open(mapsUrl, '_blank')
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        View Location
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <span className="text-4xl">🍽️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
                  <p className="text-gray-600">Try searching for a different location</p>
                </div>
              )}
            </div>

            {/* View All Restaurants Button */}
            {restaurants.length > 0 && (
              <div className="text-center mt-8">
                {restaurantsToShow < restaurants.length ? (
                  <Button 
                    size="lg" 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setRestaurantsToShow(prev => prev + 6)}
                  >
                    Show More Restaurants ({restaurants.length - restaurantsToShow} more)
                  </Button>
                ) : restaurants.length > 6 ? (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                    onClick={() => setRestaurantsToShow(6)}
                  >
                    Show Less Restaurants
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Why Choose GlobeTrotter Section */}
        <div className="container mx-auto px-4">
            <div className="mb-16">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Why Choose GlobeTrotter?</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Experience the future of travel planning with our intelligent platform
                </p>
              </div>
            </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardHeader>
                <MapPin className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Smart Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Discover amazing places with AI-powered recommendations based on your preferences and budget.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Itinerary Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create detailed day-by-day itineraries with drag-and-drop simplicity and time optimization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Collaborative Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Plan together with friends and family. Share itineraries and make group decisions easily.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>Budget Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Keep track of expenses with visual charts and get alerts when you're close to your budget.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Adventure?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of travelers who are planning smarter with GlobeTrotter.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-3">
                  Create Your Free Account
                </Button>
              </Link>
            </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 GlobeTrotter. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/trips/create">
          <Button 
            size="lg" 
            className="rounded-full px-6 py-4 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
          >
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">Plan a Trip</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
