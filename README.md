# Next.js Project

This is a full-stack Next.js application with Prisma, Tailwind CSS, and Playwright for testing.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
  - [Prisma Setup](#prisma-setup)
  - [Running Migrations](#running-migrations)
  - [Seeding the Database](#seeding-the-database)
- [Development](#development)
- [Testing with Playwright](#testing-with-playwright)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Next.js**: React framework for server-rendered applications
- **Prisma**: Next-generation ORM for Node.js and TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **Playwright**: End-to-end testing library

## Prerequisites

- Node.js 18.x or later
- npm or yarn or pnpm or bun
- A database (PostgreSQL, MySQL, SQLite, etc.)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/your-project-name.git
cd your-project-name
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Set up the database (see [Database Setup](#database-setup))

5. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# Next Auth (if using)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Add other environment variables as needed
```

**Important**: Never commit your `.env` file to version control. Make sure it's included in your `.gitignore` file.

## Database Setup

### Prisma Setup

This project uses Prisma as the ORM. To set up Prisma:

1. Make sure your database connection URL is in the `.env` file (see above).

2. Generate the Prisma client:

```bash
npx prisma generate
```

### Running Migrations

To create and apply migrations:

1. Make changes to your schema in `prisma/schema.prisma`

2. Create a migration:

```bash
npx prisma migrate dev --name descriptive-name
```

This will:
- Create a new migration file
- Apply the migration to your database
- Generate the Prisma client

### Seeding the Database

The project includes seed data to populate your database with initial records:

```bash
npx prisma db seed
```

**Important**: Make sure to run this command after setting up your database to ensure you have the necessary initial data.

## Development

You can start editing the pages by modifying the files in the `app` directory. The pages auto-update as you edit the files.

This project uses:
- [Next.js App Router](https://nextjs.org/docs/app) for routing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://prisma.io/) for database access

## Testing with Playwright

This project uses Playwright for end-to-end testing. To run the tests:

1. Install Playwright browsers (if you haven't already):

```bash
npx playwright install
```

2. Run the tests:

```bash
npm run test:e2e
# or
yarn test:e2e
# or
pnpm test:e2e
# or
bun test:e2e
```

You can also run the tests in UI mode:

```bash
npx playwright test --ui
```

## Deployment

The easiest way to deploy your Next.js app is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Before deployment:
1. Set up the environment variables in your hosting platform
2. Run database migrations in your production environment:
   ```bash
   npx prisma migrate deploy
   ```
3. Seed the production database if needed:
   ```bash
   npx prisma db seed
   ```

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Structure

```
├── app/              # Next.js App Router pages and layouts
├── components/       # React components
├── lib/              # Utility functions and shared code
├── prisma/           # Prisma schema and migrations
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Database seed script
├── public/           # Static assets
├── styles/           # Global styles
├── tests/            # Playwright tests
└── ...config files
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)