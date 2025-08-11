'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalBudget: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start < end
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

type TripFormData = z.infer<typeof tripSchema>

interface Trip {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  totalBudget: number | null
  user: {
    email: string
  }
}

export default function EditTrip() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [fetchingTrip, setFetchingTrip] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  })

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
        
        // Populate form with existing data
        reset({
          name: data.trip.name,
          description: data.trip.description || '',
          startDate: new Date(data.trip.startDate).toISOString().split('T')[0],
          endDate: new Date(data.trip.endDate).toISOString().split('T')[0],
          totalBudget: data.trip.totalBudget ? data.trip.totalBudget.toString() : '',
        })
      } else {
        router.push('/trips')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
      router.push('/trips')
    } finally {
      setFetchingTrip(false)
    }
  }

  if (status === 'loading' || fetchingTrip) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return null
  }

  const onSubmit = async (data: TripFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          totalBudget: data.totalBudget,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/trips/${params.id}`)
        }, 1000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update trip')
      }
    } catch (error) {
      console.error('Error updating trip:', error)
      setError('An error occurred while updating the trip')
    } finally {
      setIsLoading(false)
    }
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
                  Back
                </Button>
              </Link>
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <MapPin className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Edit Trip</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Trip Details</CardTitle>
              <CardDescription>
                Update your trip information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  Trip updated successfully! Redirecting...
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Trip Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter trip name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe your trip..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                      className={errors.startDate ? 'border-red-500' : ''}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                      className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget (₹) (Optional)</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('totalBudget')}
                    placeholder="Enter total budget in INR"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Link href={`/trips/${params.id}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Trip'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
