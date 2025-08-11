'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Plane, 
  User, 
  Mail, 
  Edit, 
  Save, 
  X,
  ArrowLeft,
  Globe,
  Camera,
  Plus
} from 'lucide-react'
import { TripWithDetails } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

interface UserProfile {
  name: string
  email: string
  bio?: string
  location?: string
  preferredCurrency: string
  travelStyle?: string
  interests?: string[]
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<TripWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
    location: '',
    preferredCurrency: 'INR',
    travelStyle: '',
    interests: []
  })
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)
  const [savedProfile, setSavedProfile] = useState<UserProfile>(profile)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      // Fetch profile data from the API
      fetchUserProfile()
      fetchTrips()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const userProfile = {
          name: data.user.name || '',
          email: data.user.email || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          preferredCurrency: data.user.preferredCurrency || 'INR',
          travelStyle: data.user.travelStyle || '',
          interests: data.user.interests || []
        }
        setProfile(userProfile)
        setEditedProfile(userProfile)
        setSavedProfile(userProfile)
      } else {
        // Fallback to session data if API fails
        const fallbackProfile = {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          bio: '',
          location: '',
          preferredCurrency: 'INR',
          travelStyle: '',
          interests: []
        }
        setProfile(fallbackProfile)
        setEditedProfile(fallbackProfile)
        setSavedProfile(fallbackProfile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to session data
      const fallbackProfile = {
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        bio: '',
        location: '',
        preferredCurrency: 'INR',
        travelStyle: '',
        interests: []
      }
      setProfile(fallbackProfile)
      setEditedProfile(fallbackProfile)
      setSavedProfile(fallbackProfile)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips)
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProfile.name,
          bio: editedProfile.bio,
          location: editedProfile.location,
          travelStyle: editedProfile.travelStyle,
          interests: editedProfile.interests,
          preferredCurrency: editedProfile.preferredCurrency,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const data = await response.json()
      
      // Update local state with the saved data
      setProfile(editedProfile)
      setSavedProfile(editedProfile)
      setIsEditing(false)
      
      // Update the session if name changed
      if (editedProfile.name !== session?.user?.name) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: editedProfile.name
          }
        })
      }
      
      console.log('Profile updated successfully:', data.message)
      
      // Show success message
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      // Show error to user (you might want to add a toast notification here)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    // Revert to the last saved profile
    setEditedProfile(savedProfile)
    setProfile(savedProfile)
    setIsEditing(false)
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(editedProfile) !== JSON.stringify(savedProfile)

  // Real-time update function
  const updateProfileField = (field: keyof UserProfile, value: string | string[]) => {
    const updatedProfile = { ...editedProfile, [field]: value }
    setEditedProfile(updatedProfile)
    // Update the display profile in real-time while editing
    if (isEditing) {
      setProfile(updatedProfile)
    }
  }

  if (status === 'loading' || isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Loading your profile...</div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > new Date())
  const pastTrips = trips.filter(trip => new Date(trip.endDate) < new Date())
  const ongoingTrips = trips.filter(trip => {
    const now = new Date()
    return new Date(trip.startDate) <= now && new Date(trip.endDate) >= now
  })
  const totalBudget = trips.reduce((sum, trip) => sum + (trip.totalBudget || 0), 0)
  const countriesVisited = new Set(trips.flatMap(trip => trip.stops.map(stop => stop.city.country))).size
  const citiesVisited = new Set(trips.flatMap(trip => trip.stops.map(stop => stop.city.name))).size

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .input-editing {
          background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <Navbar showBackButton={true} backHref="/dashboard" />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Profile */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                  <CardDescription>Manage your personal information and preferences</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSaveProfile} 
                      size="sm"
                      className={`transition-all duration-200 ${hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      disabled={!hasUnsavedChanges || isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    {hasUnsavedChanges && (
                      <span className="text-xs text-amber-600 self-center ml-2 animate-pulse">
                        • Unsaved changes
                      </span>
                    )}
                    {saveSuccess && (
                      <span className="text-xs text-green-600 self-center ml-2 animate-fade-in">
                        ✓ Profile saved successfully!
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Placeholder */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center transition-all duration-300 ${isEditing ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}>
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    {isEditing && (
                      <button className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors">
                        <Camera className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold transition-all duration-200">
                      {profile.name}
                      {isEditing && profile.name !== savedProfile.name && (
                        <span className="ml-2 text-xs text-blue-600 font-normal animate-pulse">(editing...)</span>
                      )}
                    </h3>
                    <p className="text-gray-600">{profile.email}</p>
                    {isEditing && profile.location && (
                      <p className="text-sm text-gray-500 mt-1 transition-all duration-200 animate-fade-in">
                        📍 {profile.location}
                      </p>
                    )}
                    {isEditing && profile.travelStyle && (
                      <p className="text-sm text-gray-500 mt-1 transition-all duration-200 animate-fade-in">
                        ✈️ {profile.travelStyle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedProfile.name}
                        onChange={(e) => updateProfileField('name', e.target.value)}
                        className={`transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                          editedProfile.name !== savedProfile.name ? 'border-blue-400 bg-blue-50' : ''
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <p className="mt-1 text-sm text-gray-600">{profile.email} (Read-only)</p>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        placeholder="e.g., Mumbai, India"
                        value={editedProfile.location}
                        onChange={(e) => updateProfileField('location', e.target.value)}
                        className={`transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                          editedProfile.location !== savedProfile.location ? 'border-green-400 bg-green-50' : ''
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.location || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="travelStyle">Travel Style</Label>
                    {isEditing ? (
                      <Input
                        id="travelStyle"
                        placeholder="e.g., Adventure, Luxury, Budget"
                        value={editedProfile.travelStyle}
                        onChange={(e) => updateProfileField('travelStyle', e.target.value)}
                        className={`transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                          editedProfile.travelStyle !== savedProfile.travelStyle ? 'border-purple-400 bg-purple-50' : ''
                        }`}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.travelStyle || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself and your travel experiences..."
                      value={editedProfile.bio}
                      onChange={(e) => updateProfileField('bio', e.target.value)}
                      rows={3}
                      className={`transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${
                        editedProfile.bio !== savedProfile.bio ? 'border-amber-400 bg-amber-50' : ''
                      }`}
                    />
                  ) : (
                    <div className="mt-1 text-sm text-gray-900 min-h-[60px] p-3 bg-gray-50 rounded-md">
                      {profile.bio || 'No bio added yet'}
                    </div>
                  )}
                  {isEditing && profile.bio && (
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.bio.length} characters
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comprehensive Trips Section */}
            <Card>
              <CardHeader>
                <CardTitle>My Trips</CardTitle>
                <CardDescription>Organize and view all your travel adventures</CardDescription>
              </CardHeader>
              <CardContent>
                {trips.length === 0 ? (
                  <div className="text-center py-8">
                    <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                    <p className="text-gray-600 mb-4">Start planning your first adventure!</p>
                    <Link href="/trips/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Ongoing Trips */}
                    {ongoingTrips.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg text-green-700 flex items-center">
                            <Plane className="h-5 w-5 mr-2" />
                            Ongoing Trips
                          </h3>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {ongoingTrips.length} active
                          </span>
                        </div>
                        <div className="grid gap-4">
                          {ongoingTrips.map((trip) => (
                            <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                              <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-green-900">{trip.name}</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-green-600">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''}
                                      <span className="mx-2">•</span>
                                      <IndianRupee className="h-4 w-4 mr-1" />
                                      {formatCurrency(trip.totalBudget || 0)}
                                    </div>
                                  </div>
                                  <div className="text-green-600">
                                    <Calendar className="h-5 w-5" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Trips */}
                    {upcomingTrips.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg text-blue-700 flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Upcoming Trips
                          </h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {upcomingTrips.length} planned
                          </span>
                        </div>
                        <div className="grid gap-4">
                          {upcomingTrips.map((trip) => (
                            <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-blue-900">{trip.name}</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-blue-600">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''}
                                      <span className="mx-2">•</span>
                                      <IndianRupee className="h-4 w-4 mr-1" />
                                      {formatCurrency(trip.totalBudget || 0)}
                                    </div>
                                  </div>
                                  <div className="text-blue-600">
                                    <Plane className="h-5 w-5" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Trips */}
                    {pastTrips.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg text-gray-700 flex items-center">
                            <MapPin className="h-5 w-5 mr-2" />
                            Completed Trips
                          </h3>
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {pastTrips.length} completed
                          </span>
                        </div>
                        <div className="grid gap-4">
                          {pastTrips.slice(0, 10).map((trip) => (
                            <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                              <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{trip.name}</h4>
                                    <p className="text-sm text-gray-700 mt-1">
                                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                    </p>
                                    <div className="flex items-center mt-2 text-sm text-gray-600">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''}
                                      <span className="mx-2">•</span>
                                      <IndianRupee className="h-4 w-4 mr-1" />
                                      {formatCurrency(trip.totalBudget || 0)}
                                    </div>
                                  </div>
                                  <div className="text-gray-600">
                                    <Globe className="h-5 w-5" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {pastTrips.length > 10 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">
                                And {pastTrips.length - 10} more completed trip{pastTrips.length - 10 !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Action */}
                    <div className="pt-4 border-t">
                      <Link href="/trips/create">
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Plan New Trip
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Travel Statistics */}
          <div className="space-y-6">
            {/* Travel Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Travel Statistics</CardTitle>
                <CardDescription>Your travel journey at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Total Trips</span>
                  </div>
                  <span className="text-lg font-bold">{trips.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Upcoming Trips</span>
                  </div>
                  <span className="text-lg font-bold">{upcomingTrips.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Ongoing Trips</span>
                  </div>
                  <span className="text-lg font-bold">{ongoingTrips.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">Completed Trips</span>
                  </div>
                  <span className="text-lg font-bold">{pastTrips.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Countries Visited</span>
                  </div>
                  <span className="text-lg font-bold">{countriesVisited}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Cities Visited</span>
                  </div>
                  <span className="text-lg font-bold">{citiesVisited}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">Total Budget</span>
                  </div>
                  <span className="text-lg font-bold">{formatCurrency(totalBudget)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/trips/create">
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Plan New Trip
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full" variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Travel Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Travel Preferences</CardTitle>
                <CardDescription>Your travel settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferred Currency</Label>
                  <p className="mt-1 text-sm text-gray-900">Indian Rupee (₹)</p>
                </div>
                <div>
                  <Label>Notification Preferences</Label>
                  <p className="mt-1 text-sm text-gray-900">Email notifications for trip updates</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
