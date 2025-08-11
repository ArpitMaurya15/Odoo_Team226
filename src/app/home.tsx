import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Users, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <MapPin className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">GlobeTrotter</span>
          </Link>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl font-bold text-gray-900">
            Plan Your Perfect Trip with{' '}
            <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            GlobeTrotter combines smart recommendations, collaborative planning, and budget tracking 
            to make your travel planning effortless and enjoyable.
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Planning
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                View Demo
              </Button>
            </Link>
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
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-3">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 GlobeTrotter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
