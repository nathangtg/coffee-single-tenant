# Coffee Shop Single Tenant Application

A modern, full-stack application for managing a coffee shop business. Built with Next.js, Prisma, and React, this solution provides everything needed to run a coffee shop's digital operations.

## Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Menu Management**: Add, edit, and categorize menu items with custom options
- **Order Processing**: Complete order lifecycle from creation to fulfillment
- **Cart System**: Intuitive shopping cart for customers
- **Payment Integration**: Support for various payment methods
- **Favorites & Reviews**: Allow customers to save favorites and leave reviews
- **Responsive Design**: Works seamlessly on mobile and desktop devices
- **Admin Dashboard**: Comprehensive management tools for staff

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS with custom components
- **PDF Generation**: jsPDF for receipts and reports

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/coffee-single-tenant.git
   cd coffee-single-tenant
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/coffee_shop"
   JWT_SECRET="your-secret-key"
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
coffee-single-tenant/
├── app/               # Next.js app router
│   ├── api/           # API routes
│   ├── admin/         # Admin dashboard pages
│   ├── auth/          # Authentication pages
│   ├── menu/          # Menu pages
│   └── cart/          # Shopping cart pages
├── components/        # React components
├── lib/               # Utility functions and hooks
├── prisma/            # Prisma schema and migrations
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Seed data
├── public/            # Static assets
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## Database Schema

The application uses a comprehensive database schema designed for coffee shop operations:

- Users (customers, staff, admins)
- Menu categories and items
- Customization options
- Orders and order items
- Payments
- Reviews and favorites
- Store settings

## Deployment

This application can be deployed to any platform that supports Next.js applications:

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
