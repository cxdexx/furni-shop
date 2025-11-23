# Furni-Shop 🪑

Modern furniture marketplace connecting Nigerian buyers directly with local artisans.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Unsplash API key

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd furni-shop

# 2. Install dependencies
npm install

# 3. Setup environment
# Edit server/.env with your database URL
# Edit seed/.env with your Unsplash API key

# 4. Setup database
cd server
npx prisma migrate dev
npx prisma generate

# 5. Fetch images (500-1000)
cd ../seed
npm run seed:images

# 6. Generate listings
npm run seed:listings

# 7. Seed database
npm run seed:db

# 8. Start development servers
cd ..
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Image Management](docs/IMAGES.md)
- [Auth Migration Guide](docs/AUTH_MIGRATION.md)
- [Wireframes](docs/WIREFRAMES.md)

## Project Structure

```
furni-shop/
├── client/          # Next.js frontend
├── server/          # Express backend
├── seed/            # Data seeding scripts
└── docs/            # Documentation
```

## Features

### For Buyers
- Browse 500+ furniture listings
- Advanced search & filters
- Contact owner directly
- Delivery calculator
- Meet the producer option

### For Owner
- Order management dashboard
- Message inbox
- Producer directory
- Analytics (future)

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: Express, Prisma, PostgreSQL
- **Images**: Unsplash API (500-1000 licensed images)

## Deployment

- Frontend: Vercel
- Backend: Railway/Render
- Database: Railway/Neon

## License

MIT

---

Built with ❤️ for the Nigerian furniture market
