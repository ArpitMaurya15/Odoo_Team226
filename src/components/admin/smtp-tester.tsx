'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function SmtpTester() {
  const [testEmail, setTestEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    config?: any
    error?: string
  } | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/test-smtp')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to test connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const debugSmtp = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/debug/smtp')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to debug SMTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>SMTP Test</span>
        </CardTitle>
        <CardDescription>
          Test SMTP configuration for OTP email delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button 
            onClick={debugSmtp} 
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            Debug
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="testEmail"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={sendTestEmail} 
              disabled={isLoading || !testEmail}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Test
            </Button>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {result.success ? 'Success' : 'Error'}
              </span>
            </div>
            <p className="text-sm mb-2">{result.message}</p>
            
            {result.config && (
              <div className="text-xs bg-white bg-opacity-50 p-2 rounded mt-2">
                <strong>Configuration:</strong>
                <br />Host: {result.config.host}
                <br />Port: {result.config.port}
                <br />User: {result.config.user}
                <br />Password: {result.config.passConfigured ? 'Configured' : 'Missing'}
              </div>
            )}
            
            {result.error && (
              <div className="text-xs bg-white bg-opacity-50 p-2 rounded mt-2">
                <strong>Error Details:</strong>
                <br />{result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
