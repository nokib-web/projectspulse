# ProjectPulse

**Project Health & Client Feedback Tracker**

## Overview

ProjectPulse is a comprehensive project management and client feedback tracking system built with Next.js, TypeScript, and Prisma. It enables teams to monitor project health, collect client feedback, and stay on track with real-time insights.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **UI Components**: Lucide React icons, Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd projectpulse
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the values with your actual configuration:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: A secure random string (minimum 32 characters)
     - `JWT_EXPIRY`: Token expiration time (e.g., "7d")

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
projectpulse/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app router pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── lib/
│   │   └── db.ts              # Prisma client singleton
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── .env.example               # Environment variables template
├── .env.local                 # Local environment variables (not committed)
├── prisma.config.ts           # Prisma 7 configuration
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features (Planned)

- 🔐 User authentication (Admin, Employee, Client roles)
- 📊 Project health tracking
- 💬 Client feedback collection
- 📈 Real-time analytics and reporting
- 🎯 Risk management
- 📱 Responsive design

## License

MIT

## Author

Built with ❤️ using Next.js and Prisma
