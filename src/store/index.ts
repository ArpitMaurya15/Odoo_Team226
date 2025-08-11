import { create } from 'zustand'
import { Trip, Stop, Activity, City, TripWithDetails } from '@/types'

interface TripStore {
  trips: TripWithDetails[]
  currentTrip: TripWithDetails | null
  isLoading: boolean
  setTrips: (trips: TripWithDetails[]) => void
  setCurrentTrip: (trip: TripWithDetails | null) => void
  addTrip: (trip: TripWithDetails) => void
  updateTrip: (id: string, updates: Partial<Trip>) => void
  deleteTrip: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  setTrips: (trips) => set({ trips }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === id ? { ...trip, ...updates } : trip
      ),
      currentTrip:
        state.currentTrip?.id === id
          ? { ...state.currentTrip, ...updates }
          : state.currentTrip,
    })),
  deleteTrip: (id) =>
    set((state) => ({
      trips: state.trips.filter((trip) => trip.id !== id),
      currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}))

interface UserStore {
  savedCities: City[]
  setSavedCities: (cities: City[]) => void
  addSavedCity: (city: City) => void
  removeSavedCity: (cityId: string) => void
}

export const useUserStore = create<UserStore>((set) => ({
  savedCities: [],
  setSavedCities: (cities) => set({ savedCities: cities }),
  addSavedCity: (city) =>
    set((state) => ({ savedCities: [...state.savedCities, city] })),
  removeSavedCity: (cityId) =>
    set((state) => ({
      savedCities: state.savedCities.filter((city) => city.id !== cityId),
    })),
}))
