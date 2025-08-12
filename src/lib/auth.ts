import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - how often to refresh the session
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      
      // Refresh the token if it's being updated
      if (trigger === 'update') {
        return token
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If it's a relative URL, prepend baseUrl
      if (url.startsWith('/') && !url.startsWith(baseUrl)) {
        return `${baseUrl}${url}`
      }
      
      // If the URL is on the same origin, allow it
      try {
        if (new URL(url).origin === baseUrl) {
          return url
        }
      } catch {
        // Invalid URL, default to dashboard
        return `${baseUrl}/dashboard`
      }
      
      // For most cases, let the signin page handle the role-based redirect
      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}
