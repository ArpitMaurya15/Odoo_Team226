'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MapPin, User, LogOut, Plane, Calendar, Users, DollarSign } from 'lucide-react'

interface NavbarProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
  showNavigation?: boolean
  isAdminPage?: boolean
}

export function Navbar({ title = 'GlobeTrotter', showBackButton = false, backHref, showNavigation = false, isAdminPage = false }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // Get default back href based on user role
  const getDefaultBackHref = () => {
    if (session?.user?.role === 'ADMIN') {
      return '/admin'
    }
    return '/dashboard'
  }

  const actualBackHref = backHref || getDefaultBackHref()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={actualBackHref}>
                <Button variant="ghost" size="sm">
                  ← Back
                </Button>
              </Link>
            )}
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{title}</span>
            </Link>
          </div>

          {/* Center Navigation */}
          {showNavigation && session && !isAdminPage && (
            <div className="flex items-center space-x-6">
              <Link href="/trips">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Plane className="h-4 w-4" />
                  <span>Trips</span>
                </Button>
              </Link>
              <Link href="/itinerary">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Itinerary</span>
                </Button>
              </Link>
              <Link href="/expenditure">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Expenditure</span>
                </Button>
              </Link>
              <Link href="/community">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Community</span>
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {!isAdminPage && (
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-1" />
                      Profile
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
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
        </div>
      </div>
    </header>
  )
}
