'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Search, Star, Clock, Navigation, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CitiesPage() {
  const { data: session } = useSession()
  const [selectedCity, setSelectedCity] = useState('')
  const [places, setPlaces] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Popular cities for quick selection
  const popularCities = [
    { name: 'Mumbai', country: 'India', state: 'Maharashtra' },
    { name: 'Delhi', country: 'India', state: 'Delhi' },
    { name: 'Tokyo', country: 'Japan', state: 'Tokyo' },
    { name: 'Paris', country: 'France', state: 'Île-de-France' },
    { name: 'New York', country: 'USA', state: 'New York' },
    { name: 'London', country: 'UK', state: 'England' },
    { name: 'Bangkok', country: 'Thailand', state: 'Bangkok' },
    { name: 'Dubai', country: 'UAE', state: 'Dubai' },
    { name: 'Singapore', country: 'Singapore', state: 'Singapore' },
    { name: 'Istanbul', country: 'Turkey', state: 'Istanbul' },
    { name: 'Barcelona', country: 'Spain', state: 'Catalonia' },
    { name: 'Rome', country: 'Italy', state: 'Lazio' }
  ]

  // Fetch popular places for a city using Gemini API
  const fetchCityPlaces = async (cityName: string) => {
    if (!cityName.trim()) return
    
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/cities/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city: cityName })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch places')
      }

      const data = await response.json()

      if (data.places && Array.isArray(data.places)) {
        setPlaces(data.places)
        
        // Add to search history
        setSearchHistory(prev => {
          const newHistory = [cityName, ...prev.filter(city => city !== cityName)]
          return newHistory.slice(0, 5) // Keep only last 5 searches
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching places:', err)
      setError('Failed to load places for this city. Please try again.')
      
      // Fallback places for popular cities
      const fallbackPlaces = getFallbackPlaces(cityName)
      setPlaces(fallbackPlaces)
    } finally {
      setLoading(false)
    }
  }

  // Fallback places for when API fails
  const getFallbackPlaces = (cityName: string) => {
    const city = cityName.toLowerCase()
    
    if (city.includes('mumbai')) {
      return [
        { id: 1, name: 'Gateway of India', description: 'Iconic monument overlooking the Arabian Sea', rating: 4.5, type: 'Monument', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        { id: 2, name: 'Marine Drive', description: 'Beautiful seafront promenade known as Queen\'s Necklace', rating: 4.6, type: 'Waterfront', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        { id: 3, name: 'Chhatrapati Shivaji Terminus', description: 'UNESCO World Heritage railway station', rating: 4.4, type: 'Architecture', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        { id: 4, name: 'Elephanta Caves', description: 'Ancient rock-cut caves dedicated to Lord Shiva', rating: 4.3, type: 'Historical', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        { id: 5, name: 'Bollywood Studios', description: 'Film city and entertainment hub', rating: 4.2, type: 'Entertainment', city: 'Mumbai', state: 'Maharashtra', country: 'India' }
      ]
    } else if (city.includes('tokyo')) {
      return [
        { id: 1, name: 'Tokyo Tower', description: 'Iconic red and white communications tower', rating: 4.5, type: 'Landmark', city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
        { id: 2, name: 'Senso-ji Temple', description: 'Ancient Buddhist temple in Asakusa', rating: 4.7, type: 'Temple', city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
        { id: 3, name: 'Shibuya Crossing', description: 'World\'s busiest pedestrian crossing', rating: 4.6, type: 'Urban', city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
        { id: 4, name: 'Imperial Palace', description: 'Primary residence of the Emperor of Japan', rating: 4.4, type: 'Palace', city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
        { id: 5, name: 'Tsukiji Fish Market', description: 'Famous fish market and sushi destination', rating: 4.3, type: 'Market', city: 'Tokyo', state: 'Tokyo', country: 'Japan' }
      ]
    }
    
    return [
      { id: 1, name: `${cityName} City Center`, description: 'Main downtown area with shopping and dining', rating: 4.0, type: 'Urban', city: cityName, state: '', country: '' },
      { id: 2, name: `${cityName} Museum`, description: 'Local history and culture museum', rating: 4.2, type: 'Museum', city: cityName, state: '', country: '' },
      { id: 3, name: `${cityName} Park`, description: 'Beautiful green space for relaxation', rating: 4.1, type: 'Nature', city: cityName, state: '', country: '' }
    ]
  }

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName)
    fetchCityPlaces(cityName)
  }

  const handleSearch = () => {
    if (selectedCity.trim()) {
      fetchCityPlaces(selectedCity)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <MapPin className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">GlobeTrotter</span>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore City <span className="text-blue-600">Attractions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select any city worldwide and discover the most popular places to visit, powered by AI recommendations
          </p>
        </div>

        {/* City Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search City</span>
              </CardTitle>
              <CardDescription>
                Enter any city name or select from popular destinations below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="city">City Name</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Paris, Tokyo, Mumbai..."
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading || !selectedCity.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Cities */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Popular Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {popularCities.map((city) => (
              <Button
                key={city.name}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50"
                onClick={() => handleCitySelect(city.name)}
              >
                <MapPin className="h-5 w-5 text-blue-600" />
                <div className="text-center">
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-500">{city.country}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mb-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((city, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCitySelect(city)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {city}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600 text-center">{error}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Places Results */}
        {places.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-center mb-8">
              Popular Places in <span className="text-blue-600">{selectedCity}</span>
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => (
                <Card key={place.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center space-x-2">
                          <Navigation className="h-5 w-5 text-blue-600" />
                          <span>{place.name}</span>
                        </CardTitle>
                        {place.rating && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{place.rating}</span>
                          </div>
                        )}
                      </div>
                      {place.type && (
                        <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                          {place.type}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      {place.description || `Popular attraction in ${selectedCity}`}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {place.city && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          📍 {place.city}
                        </span>
                      )}
                      {place.type && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          🏛️ {place.type}
                        </span>
                      )}
                    </div>

                    {/* Google Maps Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center space-x-2 hover:bg-blue-50"
                      onClick={() => {
                        const query = encodeURIComponent([place.name, place.city, place.state, place.country].filter(Boolean).join(', '))
                        window.open(`https://www.google.com/maps/search/${query}`, '_blank')
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>View on Google Maps</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Finding popular places in {selectedCity}...</p>
          </div>
        )}
      </div>
    </div>
  )
}
