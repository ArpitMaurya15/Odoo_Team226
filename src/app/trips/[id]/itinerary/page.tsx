'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DropResult } from 'react-beautiful-dnd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Calendar, Clock, IndianRupee, X } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import DraggableStops from '@/components/DraggableStops'

interface Activity {
  id: string
  name: string
  description?: string
  startTime?: string
  cost?: number
}

interface Stop {
  id: string
  order: number
  startDate: string
  endDate: string
  city: {
    id: string
    name: string
    country: string
  }
  activities: Activity[]
}

interface Trip {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  totalBudget: number | null
  user: {
    email: string
    name: string
  }
  stops: Stop[]
}

export default function ManageItinerary() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddStopDialog, setShowAddStopDialog] = useState(false)
  const [showEditStopDialog, setShowEditStopDialog] = useState(false)
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false)
  const [editingStop, setEditingStop] = useState<Stop | null>(null)
  const [selectedStopForActivity, setSelectedStopForActivity] = useState<Stop | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stops, setStops] = useState<Array<{
    name: string
    startDate: string
    endDate: string
    budget: string
  }>>([{ name: '', startDate: '', endDate: '', budget: '' }])
  const [editStopData, setEditStopData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  })
  const [activities, setActivities] = useState<Array<{
    name: string
    description: string
    startTime: string
    estimatedCost: string
    category: string
  }>>([{ name: '', description: '', startTime: '', estimatedCost: '', category: 'SIGHTSEEING' }])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session && params.id) {
      fetchTrip()
    }
  }, [session, params.id])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTrip(data.trip)
        
        // Check if user owns this trip
        if (data.trip.user.email !== session?.user?.email) {
          router.push(`/trips/${params.id}`)
          return
        }
      } else {
        setError('Failed to load trip')
        router.push('/trips')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
      setError('An error occurred while loading the trip')
      router.push('/trips')
    } finally {
      setIsLoading(false)
    }
  }

  const removeStopField = (index: number) => {
    if (stops.length > 1) {
      setStops(stops.filter((_, i) => i !== index))
    }
  }

  const updateStop = (index: number, field: string, value: string) => {
    const updatedStops = stops.map((stop, i) => 
      i === index ? { ...stop, [field]: value } : stop
    )
    setStops(updatedStops)
  }

  const handleSubmitStops = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Validate stops
      const validStops = stops.filter(stop => 
        stop.name.trim() && stop.startDate && stop.endDate
      )

      if (validStops.length === 0) {
        setError('Please fill in at least one complete stop')
        setIsSubmitting(false)
        return
      }

      // Validate date ranges
      for (const stop of validStops) {
        if (new Date(stop.startDate) >= new Date(stop.endDate)) {
          setError('End date must be after start date for all stops')
          setIsSubmitting(false)
          return
        }
      }

      // Call API to create stops
      const response = await fetch(`/api/trips/${params.id}/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stops: validStops }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Stops created:', result)
        
        setShowAddStopDialog(false)
        setStops([{ name: '', startDate: '', endDate: '', budget: '' }])
        
        // Refresh trip data to show new stops
        await fetchTrip()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create stops')
      }
    } catch (error) {
      console.error('Error creating stops:', error)
      setError('An error occurred while creating stops')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStop = (stop: Stop) => {
    setEditingStop(stop)
    setEditStopData({
      name: `${stop.city.name}${stop.city.country && stop.city.country !== 'Unknown' ? `, ${stop.city.country}` : ''}`,
      startDate: stop.startDate.split('T')[0],
      endDate: stop.endDate.split('T')[0]
    })
    setShowEditStopDialog(true)
  }

  const handleUpdateStop = async () => {
    if (!editingStop) return

    setIsSubmitting(true)
    setError('')

    try {
      const { name, startDate, endDate } = editStopData

      if (!name.trim() || !startDate || !endDate) {
        setError('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      if (new Date(startDate) >= new Date(endDate)) {
        setError('End date must be after start date')
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`/api/trips/${params.id}/stops/${editingStop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, startDate, endDate }),
      })

      if (response.ok) {
        setShowEditStopDialog(false)
        setEditingStop(null)
        await fetchTrip()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update stop')
      }
    } catch (error) {
      console.error('Error updating stop:', error)
      setError('An error occurred while updating the stop')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm('Are you sure you want to delete this stop? This will also delete all activities associated with it.')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/trips/${params.id}/stops/${stopId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTrip()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete stop')
      }
    } catch (error) {
      console.error('Error deleting stop:', error)
      setError('An error occurred while deleting the stop')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteActivity = async (stopId: string, activityId: string) => {
    if (!confirm('Are you sure you want to delete this todo item?')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/trips/${params.id}/stops/${stopId}/activities/${activityId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTrip()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete todo item')
      }
    } catch (error) {
      console.error('Error deleting todo item:', error)
      setError('An error occurred while deleting the todo item')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddActivity = (stop: Stop) => {
    setSelectedStopForActivity(stop)
    setActivities([{ name: '', description: '', startTime: '', estimatedCost: '', category: 'SIGHTSEEING' }])
    setShowAddActivityDialog(true)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !trip) {
      return
    }

    const { source, destination } = result

    // If dropped in the same position, do nothing
    if (source.index === destination.index) {
      return
    }

    // Create a new array with reordered stops
    const reorderedStops = Array.from(trip.stops)
    const [movedStop] = reorderedStops.splice(source.index, 1)
    reorderedStops.splice(destination.index, 0, movedStop)

    // Update local state immediately for better UX
    const updatedTrip = {
      ...trip,
      stops: reorderedStops.map((stop, index) => ({
        ...stop,
        order: index
      }))
    }
    setTrip(updatedTrip)

    try {
      // Prepare the new order data
      const stopOrders = reorderedStops.map((stop, index) => ({
        id: stop.id,
        order: index
      }))

      // Update the order on the server
      const response = await fetch(`/api/trips/${params.id}/stops`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stopOrders }),
      })

      if (!response.ok) {
        throw new Error('Failed to update stop order')
      }

      console.log('Stop order updated successfully')
    } catch (error) {
      console.error('Error updating stop order:', error)
      setError('Failed to update stop order')
      // Revert the local changes if the API call failed
      await fetchTrip()
    }
  }

  const addActivityField = () => {
    setActivities([...activities, { name: '', description: '', startTime: '', estimatedCost: '', category: 'SIGHTSEEING' }])
  }

  const removeActivityField = (index: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index))
    }
  }

  const updateActivity = (index: number, field: string, value: string) => {
    const updatedActivities = activities.map((activity, i) => 
      i === index ? { ...activity, [field]: value } : activity
    )
    setActivities(updatedActivities)
  }

  const handleSubmitActivities = async () => {
    if (!selectedStopForActivity) return

    setIsSubmitting(true)
    setError('')

    try {
      // Validate activities
      const validActivities = activities.filter(activity => 
        activity.name.trim()
      )

      if (validActivities.length === 0) {
        setError('Please add at least one todo item with a name')
        setIsSubmitting(false)
        return
      }

      // Call API to create activities
      const response = await fetch(`/api/trips/${params.id}/stops/${selectedStopForActivity.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activities: validActivities }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Activities created:', result)
        
        setShowAddActivityDialog(false)
        setSelectedStopForActivity(null)
        setActivities([{ name: '', description: '', startTime: '', estimatedCost: '', category: 'SIGHTSEEING' }])
        
        // Refresh trip data to show new todo items
        await fetchTrip()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create todo items')
      }
    } catch (error) {
      console.error('Error creating todo items:', error)
      setError('An error occurred while creating todo items')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Trip not found</h2>
          <Link href="/trips">
            <Button>Back to Trips</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/trips/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Trip
                </Button>
              </Link>
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <MapPin className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Manage Itinerary</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Trip Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}</span>
              </div>
              {trip.totalBudget && (
                <div className="flex items-center space-x-1">
                  <IndianRupee className="h-4 w-4" />
                  <span>{formatCurrency(trip.totalBudget)} budget</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Itinerary Management */}
          <div className="space-y-6">
            {trip.stops.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stops planned yet</h3>
                  <p className="text-gray-600 mb-4">Start building your itinerary by adding stops and activities.</p>
                  <Dialog open={showAddStopDialog} onOpenChange={setShowAddStopDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Stop
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Stops to Your Trip</DialogTitle>
                        <DialogDescription>
                          Add one or more stops to your itinerary. Each stop should include the location, dates, and optional budget.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {stops.map((stop, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Stop {index + 1}</h4>
                              {stops.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStopField(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`stop-name-${index}`}>Stop Name</Label>
                                <Input
                                  id={`stop-name-${index}`}
                                  placeholder="e.g., Paris, Tokyo, New York"
                                  value={stop.name}
                                  onChange={(e) => updateStop(index, 'name', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`stop-budget-${index}`}>Budget (₹) (Optional)</Label>
                                <Input
                                  id={`stop-budget-${index}`}
                                  type="number"
                                  placeholder="0"
                                  value={stop.budget}
                                  onChange={(e) => updateStop(index, 'budget', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`stop-start-${index}`}>Start Date</Label>
                                <Input
                                  id={`stop-start-${index}`}
                                  type="date"
                                  value={stop.startDate}
                                  onChange={(e) => updateStop(index, 'startDate', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`stop-end-${index}`}>End Date</Label>
                                <Input
                                  id={`stop-end-${index}`}
                                  type="date"
                                  value={stop.endDate}
                                  onChange={(e) => updateStop(index, 'endDate', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddStopDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitStops}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Creating...' : 'Create Stops'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <DraggableStops
                stops={trip.stops}
                onDragEnd={handleDragEnd}
                onEditStop={handleEditStop}
                onDeleteStop={handleDeleteStop}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                isDeleting={isDeleting}
              />
            )}
            
            {/* Add Stop button for when there are existing stops */}
            {trip.stops.length > 0 && (
              <Dialog open={showAddStopDialog} onOpenChange={setShowAddStopDialog}>
                <DialogTrigger asChild>
                  <Card className="border-dashed">
                    <CardContent className="text-center py-8">
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Stop
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Stops to Your Trip</DialogTitle>
                    <DialogDescription>
                      Add one or more stops to your itinerary. Each stop should include the location, dates, and optional budget.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {stops.map((stop, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Stop {index + 1}</h4>
                          {stops.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStopField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`stop-name-${index}`}>Stop Name</Label>
                            <Input
                              id={`stop-name-${index}`}
                              placeholder="e.g., Paris, Tokyo, New York"
                              value={stop.name}
                              onChange={(e) => updateStop(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`stop-budget-${index}`}>Budget (₹) (Optional)</Label>
                            <Input
                              id={`stop-budget-${index}`}
                              type="number"
                              placeholder="0"
                              value={stop.budget}
                              onChange={(e) => updateStop(index, 'budget', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`stop-start-${index}`}>Start Date</Label>
                            <Input
                              id={`stop-start-${index}`}
                              type="date"
                              value={stop.startDate}
                              onChange={(e) => updateStop(index, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`stop-end-${index}`}>End Date</Label>
                            <Input
                              id={`stop-end-${index}`}
                              type="date"
                              value={stop.endDate}
                              onChange={(e) => updateStop(index, 'endDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddStopDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitStops}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Stops'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </main>

      {/* Edit Stop Dialog */}
      <Dialog open={showEditStopDialog} onOpenChange={setShowEditStopDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stop</DialogTitle>
            <DialogDescription>
              Update the details of your stop.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stop-name">Stop Name</Label>
              <Input
                id="edit-stop-name"
                placeholder="e.g., Paris, Tokyo, New York"
                value={editStopData.name}
                onChange={(e) => setEditStopData({ ...editStopData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stop-start">Start Date</Label>
              <Input
                id="edit-stop-start"
                type="date"
                value={editStopData.startDate}
                onChange={(e) => setEditStopData({ ...editStopData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stop-end">End Date</Label>
              <Input
                id="edit-stop-end"
                type="date"
                value={editStopData.endDate}
                onChange={(e) => setEditStopData({ ...editStopData, endDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditStopDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStop}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Stop'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Todo Dialog */}
      <Dialog open={showAddActivityDialog} onOpenChange={setShowAddActivityDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Todo Items</DialogTitle>
            <DialogDescription>
              Add todo items to {selectedStopForActivity?.city.name}. You can add multiple todo items at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Todo {index + 1}</h4>
                  {activities.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeActivityField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`activity-name-${index}`}>Todo Item *</Label>
                    <Input
                      id={`activity-name-${index}`}
                      placeholder="e.g., Visit Eiffel Tower, Museum Tour"
                      value={activity.name}
                      onChange={(e) => updateActivity(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`activity-category-${index}`}>Category</Label>
                    <select
                      id={`activity-category-${index}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={activity.category}
                      onChange={(e) => updateActivity(index, 'category', e.target.value)}
                    >
                      <option value="SIGHTSEEING">Sightseeing</option>
                      <option value="FOOD">Food & Dining</option>
                      <option value="SHOPPING">Shopping</option>
                      <option value="ENTERTAINMENT">Entertainment</option>
                      <option value="ADVENTURE">Adventure & Outdoor</option>
                      <option value="CULTURE">Cultural</option>
                      <option value="TRANSPORTATION">Transportation</option>
                      <option value="ACCOMMODATION">Accommodation</option>
                      <option value="RELAXATION">Relaxation</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`activity-time-${index}`}>Scheduled Time (Optional)</Label>
                    <Input
                      id={`activity-time-${index}`}
                      type="datetime-local"
                      value={activity.startTime}
                      onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`activity-cost-${index}`}>Estimated Cost (₹) (Optional)</Label>
                    <Input
                      id={`activity-cost-${index}`}
                      type="number"
                      placeholder="0"
                      value={activity.estimatedCost}
                      onChange={(e) => updateActivity(index, 'estimatedCost', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`activity-description-${index}`}>Description (Optional)</Label>
                  <Textarea
                    id={`activity-description-${index}`}
                    placeholder="Add any notes or details about this todo item..."
                    value={activity.description}
                    onChange={(e) => updateActivity(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addActivityField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Todo
            </Button>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddActivityDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitActivities}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Todo Items'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
