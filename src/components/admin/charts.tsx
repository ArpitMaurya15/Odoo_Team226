'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

interface UserRegistrationChartProps {
  data: Array<{
    month: string
    count: number
  }>
}

export function UserRegistrationChart({ data }: UserRegistrationChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'User Registrations',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly User Registrations',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return <Bar data={chartData} options={options} />
}

interface TripsByMonthChartProps {
  data: Array<{
    month: string
    count: number
  }>
}

export function TripsByMonthChart({ data }: TripsByMonthChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Trips Created',
        data: data.map(item => item.count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Trips Created by Month',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return <Line data={chartData} options={options} />
}

interface PopularCitiesChartProps {
  data: Array<{
    cityName: string
    country: string
    visitCount: number
  }>
}

export function PopularCitiesChart({ data }: PopularCitiesChartProps) {
  const colors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
  ]

  const chartData = {
    labels: data.map(item => `${item.cityName}, ${item.country}`),
    datasets: [
      {
        label: 'Visits',
        data: data.map(item => item.visitCount),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Most Popular Destinations',
      },
    },
  }

  return <Pie data={chartData} options={options} />
}

interface ActivityCategoriesChartProps {
  data: Array<{
    activityName: string
    category: string
    count: number
  }>
}

export function ActivityCategoriesChart({ data }: ActivityCategoriesChartProps) {
  // Group activities by category
  const categoryData = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = 0
    }
    acc[item.category] += item.count
    return acc
  }, {} as Record<string, number>)

  const categories = Object.keys(categoryData)
  const counts = Object.values(categoryData)

  const colors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
  ]

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Activities',
        data: counts,
        backgroundColor: colors.slice(0, categories.length),
        borderColor: colors.slice(0, categories.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activity Categories Distribution',
      },
    },
  }

  return <Bar data={chartData} options={options} />
}

interface BudgetTrendsChartProps {
  data: Array<{
    month: string
    totalBudget: number
    averageBudget: number
  }>
}

export function BudgetTrendsChart({ data }: BudgetTrendsChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Total Budget',
        data: data.map(item => item.totalBudget),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Average Budget',
        data: data.map(item => item.averageBudget),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Budget Trends Over Time',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Total Budget (₹)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Average Budget (₹)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return <Bar data={chartData} options={options} />
}
