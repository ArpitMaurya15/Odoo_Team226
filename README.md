# GlobeTrotter - Smart Travel Planning Platform

A comprehensive travel planning platform built with Next.js 14, featuring intelligent recommendations, collaborative planning, and budget tracking.

## Features

### 🎯 Core Features
- **Smart Trip Planning**: Create detailed itineraries with AI-powered recommendations
- **Collaborative Planning**: Share trips and plan together with friends and family
- **Budget Tracking**: Track expenses with visual charts and budget alerts
- **City Discovery**: Explore destinations with cost indexes and popularity ratings
- **Activity Management**: Add, organize, and schedule activities with drag-and-drop
- **Public Sharing**: Share trip itineraries with public URLs

### 🔐 Authentication
- Email/Password authentication
- Google OAuth integration
- Role-based access control (User/Admin)
- Secure session management with NextAuth.js

### 🎨 User Interface
- Responsive design for mobile, tablet, and desktop
- Modern UI with shadcn/ui components
- Smooth animations with Framer Motion
- Dark/light mode support
- Intuitive drag-and-drop interface

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Framer Motion** - Smooth animations
- **Recharts** - Interactive charts and graphs

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication solution

### State Management
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials (optional)
- Cloudinary account (optional, for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/globetrotter.git
   cd globetrotter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/globetrotter_db"
   
   # NextAuth.js
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Cloudinary (optional)
   CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
   CLOUDINARY_API_KEY="your-cloudinary-api-key"
   CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push database schema
   npx prisma db push
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Sample Data

The seed script creates:
- Sample users (john@example.com / admin@example.com)
- Popular destinations (Paris, Tokyo, New York, Barcelona, Bangkok)
- Activity templates for each city
- Sample trip with itinerary and expenses

Login credentials for testing:
- Email: `john@example.com`
- Password: `password123`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── trips/             # Trip management pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── navbar.tsx        # Navigation component
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
├── store/                 # Zustand stores
├── types/                 # TypeScript type definitions
└── styles/               # Global styles

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seed script
```

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
