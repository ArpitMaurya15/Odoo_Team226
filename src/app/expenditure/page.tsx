'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Navbar } from '@/components/navbar'
import { DollarSign, TrendingUp, Calendar, PieChart, ArrowLeft, Plus, Receipt, Wallet, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trip, Expense, ExpenseCategory } from '@/types'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip, Legend, Pie } from 'recharts'

type TripWithExpenses = Trip & {
  expenses?: Expense[]
  totalSpent?: number
}

export default function ExpenditurePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<TripWithExpenses[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<TripWithExpenses | null>(null)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'FOOD' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchTrips()
    }
  }, [session])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        // Map expenses to the expected format and calculate totals
        const tripsWithExpenses = data.trips.map((trip: any) => ({
          ...trip,
          expenses: trip.expenses || [],
          totalSpent: trip.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0
        }))
        setTrips(tripsWithExpenses)
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!selectedTrip || !expenseForm.amount || !expenseForm.description) return

    try {
      const response = await fetch(`/api/trips/${selectedTrip.id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
          category: expenseForm.category,
          date: expenseForm.date
        })
      })

      if (response.ok) {
        const { expense } = await response.json()
        
        // Update the trip with new expense
        const updatedTrips = trips.map(trip => {
          if (trip.id === selectedTrip.id) {
            const updatedExpenses = [...(trip.expenses || []), expense]
            const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            return {
              ...trip,
              expenses: updatedExpenses,
              totalSpent
            }
          }
          return trip
        })

        setTrips(updatedTrips)
        setExpenseForm({
          amount: '',
          description: '',
          category: 'FOOD' as ExpenseCategory,
          date: new Date().toISOString().split('T')[0]
        })
        setIsExpenseDialogOpen(false)
        setSelectedTrip(null)
      } else {
        const error = await response.json()
        console.error('Error adding expense:', error)
        alert('Failed to add expense. Please try again.')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Failed to add expense. Please try again.')
    }
  }

  const handleDeleteExpense = async (tripId: string, expenseId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update the trip by removing the expense
        const updatedTrips = trips.map(trip => {
          if (trip.id === tripId) {
            const updatedExpenses = (trip.expenses || []).filter(exp => exp.id !== expenseId)
            const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            return {
              ...trip,
              expenses: updatedExpenses,
              totalSpent
            }
          }
          return trip
        })
        setTrips(updatedTrips)
      } else {
        const error = await response.json()
        console.error('Error deleting expense:', error)
        alert('Failed to delete expense. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    }
  }

  const getBudgetStatus = (trip: TripWithExpenses) => {
    if (!trip.totalBudget || trip.totalBudget === 0) return { status: 'no-budget', percentage: 0 }
    
    const spent = trip.totalSpent || 0
    const percentage = (spent / trip.totalBudget) * 100
    
    if (percentage >= 100) return { status: 'over-budget', percentage }
    if (percentage >= 80) return { status: 'warning', percentage }
    return { status: 'good', percentage }
  }

  const getTotalStats = () => {
    const totalBudget = trips.reduce((sum, trip) => sum + (trip.totalBudget || 0), 0)
    const totalSpent = trips.reduce((sum, trip) => sum + (trip.totalSpent || 0), 0)
    const totalTransactions = trips.reduce((sum, trip) => sum + (trip.expenses?.length || 0), 0)
    
    return { totalBudget, totalSpent, totalTransactions }
  }

  const getCategoryChartData = () => {
    const categoryMap = new Map()
    const allExpenses = trips.flatMap(trip => trip.expenses || [])
    
    // Category colors and display names
    const categoryConfig = {
      'FOOD': { name: 'Food & Dining', color: '#ef4444' },
      'TRANSPORTATION': { name: 'Transportation', color: '#3b82f6' },
      'ACCOMMODATION': { name: 'Accommodation', color: '#10b981' },
      'ACTIVITIES': { name: 'Activities', color: '#8b5cf6' },
      'SHOPPING': { name: 'Shopping', color: '#f59e0b' },
      'OTHER': { name: 'Other', color: '#6b7280' }
    }
    
    allExpenses.forEach(expense => {
      const category = expense.category
      const current = categoryMap.get(category) || 0
      categoryMap.set(category, current + expense.amount)
    })
    
    const chartData = Array.from(categoryMap.entries())
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => ({
        name: categoryConfig[category as keyof typeof categoryConfig]?.name || category,
        value: amount,
        color: categoryConfig[category as keyof typeof categoryConfig]?.color || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value)
    
    return chartData
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showNavigation={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showNavigation={true} />

      <main className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <nav className="text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Expenditure</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expenditure Tracking</h1>
          <p className="text-gray-600">Track and manage your travel expenses by trip</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget - stats.totalSpent)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips with Expense Management */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trips List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Trips</CardTitle>
                <CardDescription>Manage expenses for each of your trips</CardDescription>
              </CardHeader>
              <CardContent>
                {trips.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
                    <p className="text-gray-600 mb-6">Create your first trip to start tracking expenses.</p>
                    <Link href="/trips/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trips.map((trip) => {
                      const budgetStatus = getBudgetStatus(trip)
                      const hasExpenses = trip.expenses && trip.expenses.length > 0
                      
                      return (
                        <div key={trip.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{trip.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {formatDate(new Date(trip.startDate))} - {formatDate(new Date(trip.endDate))}
                              </p>
                              {trip.description && (
                                <p className="text-sm text-gray-500">{trip.description}</p>
                              )}
                            </div>
                            <Dialog open={isExpenseDialogOpen && selectedTrip?.id === trip.id} onOpenChange={(open) => {
                              setIsExpenseDialogOpen(open)
                              if (!open) setSelectedTrip(null)
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedTrip(trip)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Expense
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Expense for {trip.name}</DialogTitle>
                                  <DialogDescription>
                                    Track your spending for this trip
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                      id="amount"
                                      type="number"
                                      placeholder="0.00"
                                      value={expenseForm.amount}
                                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                      id="description"
                                      placeholder="What did you spend on?"
                                      value={expenseForm.description}
                                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                      id="category"
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                      value={expenseForm.category}
                                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}
                                    >
                                      <option value="FOOD">Food & Dining</option>
                                      <option value="TRANSPORTATION">Transportation</option>
                                      <option value="ACCOMMODATION">Accommodation</option>
                                      <option value="ACTIVITIES">Activities</option>
                                      <option value="SHOPPING">Shopping</option>
                                      <option value="OTHER">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                      id="date"
                                      type="date"
                                      value={expenseForm.date}
                                      onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                                    />
                                  </div>
                                  <Button onClick={handleAddExpense} className="w-full">
                                    Add Expense
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {/* Budget Status */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">Budget Progress</span>
                              <span className="font-medium">
                                {formatCurrency(trip.totalSpent || 0)} / {trip.totalBudget ? formatCurrency(trip.totalBudget) : 'No budget set'}
                              </span>
                            </div>
                            
                            {trip.totalBudget && trip.totalBudget > 0 ? (
                              <>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      budgetStatus.status === 'over-budget' ? 'bg-red-500' :
                                      budgetStatus.status === 'warning' ? 'bg-yellow-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                                  ></div>
                                </div>
                                
                                {/* Budget Warning */}
                                {budgetStatus.status === 'over-budget' && (
                                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Over budget by {formatCurrency((trip.totalSpent || 0) - trip.totalBudget)}
                                    </span>
                                  </div>
                                )}
                                
                                {budgetStatus.status === 'warning' && (
                                  <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-2 rounded-md">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Approaching budget limit ({budgetStatus.percentage.toFixed(1)}% used)
                                    </span>
                                  </div>
                                )}
                                
                                {budgetStatus.status === 'good' && trip.totalSpent && trip.totalSpent > 0 && (
                                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-2 rounded-md">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Within budget ({budgetStatus.percentage.toFixed(1)}% used)
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="bg-gray-50 p-2 rounded-md">
                                <span className="text-sm text-gray-600">No budget set for this trip</span>
                              </div>
                            )}
                          </div>

                          {/* Recent Expenses for this Trip */}
                          {hasExpenses && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Recent Expenses</h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {trip.expenses?.slice(-3).reverse().map((expense) => (
                                  <div key={expense.id} className="flex items-center justify-between bg-gray-50 p-2 rounded group">
                                    <div>
                                      <span className="text-sm font-medium">{expense.description}</span>
                                      <span className="text-xs text-gray-500 ml-2">({expense.category})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-red-600">
                                        -{formatCurrency(expense.amount)}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteExpense(trip.id, expense.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                                        title="Delete expense"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {trip.expenses && trip.expenses.length > 3 && (
                                  <p className="text-xs text-gray-500 text-center">
                                    +{trip.expenses.length - 3} more expenses
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expense Categories & Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Spending breakdown across all trips</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.totalTransactions === 0 ? (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm">No spending data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pie Chart */}
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={getCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {getCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Category List */}
                    <div className="space-y-3">
                      {getCategoryChartData().map((category) => {
                        const percentage = stats.totalSpent > 0 ? (category.value / stats.totalSpent) * 100 : 0
                        
                        return (
                          <div key={category.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <span className="text-sm">{category.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(category.value)}</div>
                              <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trips.filter(trip => trip.totalBudget && trip.totalBudget > 0).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No budgets set for your trips
                    </p>
                  ) : (
                    trips.filter(trip => trip.totalBudget && trip.totalBudget > 0).map((trip) => {
                      const budgetStatus = getBudgetStatus(trip)
                      return (
                        <div key={trip.id} className="border-l-4 pl-3 py-2 border-gray-200">
                          <div className="text-sm font-medium text-gray-900 truncate">{trip.name}</div>
                          <div className="text-xs text-gray-600 flex items-center justify-between">
                            <span>{formatCurrency(trip.totalSpent || 0)} / {formatCurrency(trip.totalBudget || 0)}</span>
                            {budgetStatus.status === 'over-budget' && <XCircle className="h-3 w-3 text-red-500" />}
                            {budgetStatus.status === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                            {budgetStatus.status === 'good' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/trips">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    View All Trips
                  </Button>
                </Link>
                <Link href="/trips/create">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Trip
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 Expense Tracking Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-blue-800">
                <div>
                  <h4 className="font-semibold mb-2">📱 Track Daily</h4>
                  <p>Record expenses as soon as they happen to avoid forgetting important transactions.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🗂️ Categorize Everything</h4>
                  <p>Use categories like transport, food, accommodation to understand spending patterns.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📊 Review Monthly</h4>
                  <p>Analyze your spending reports monthly to identify areas for improvement.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
