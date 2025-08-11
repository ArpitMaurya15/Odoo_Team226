import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ message: 'Cookies cleared' })
  
  // Clear all NextAuth cookies
  response.cookies.delete('next-auth.session-token')
  response.cookies.delete('__Secure-next-auth.session-token')
  response.cookies.delete('next-auth.csrf-token')
  response.cookies.delete('__Host-next-auth.csrf-token')
  response.cookies.delete('next-auth.callback-url')
  response.cookies.delete('__Secure-next-auth.callback-url')
  
  return response
}
