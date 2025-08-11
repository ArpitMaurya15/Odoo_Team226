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

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [sortBy, setSortBy] = useState('rating-desc')
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [destinations, setDestinations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    } finally {
      setLoading(false)
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
                    fetchDestinations('India') // Reset to default India destinations
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="col-span-full text-center py-12">
                  <div className="text-red-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading destinations</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={() => fetchDestinations(searchQuery || 'India')}>
                    Try Again
                  </Button>
                </div>
              ) : filteredDestinations.length > 0 ? (
                filteredDestinations.map((destination) => (
                  <Card key={destination.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden">
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
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
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
