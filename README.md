# Nursing App Backend

A robust NestJS backend for a home nursing service platform with authentication, booking management, payment processing, and review system.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Patient, Nurse, Admin)
- **User Management**: Patient and nurse registration with profile management
- **Booking System**: Schedule nursing appointments with availability checking
- **Payment Processing**: Stripe integration for secure payments
- **Review System**: Rate and review nurses after completed bookings
- **Database**: PostgreSQL with Prisma ORM
- **Docker Support**: Containerized development environment

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **Payments**: Stripe
- **Validation**: class-validator
- **Containerization**: Docker & Docker Compose

## Project Structure

```
src/
├── auth/                 # Authentication module
├── users/               # User management
├── nurses/              # Nurse profiles and management
├── bookings/            # Booking system
├── payments/            # Stripe payment integration
├── reviews/             # Review and rating system
├── common/              # Shared guards, decorators, filters
│   ├── guards/          # JWT and role guards
│   └── decorators/      # Custom decorators
└── prisma/              # Database service
```

## Database Schema

### Core Models
- **User**: Patients, nurses, and admins
- **NurseProfile**: Detailed nurse information and availability
- **Booking**: Appointment scheduling
- **Payment**: Payment tracking via Stripe
- **Review**: Nurse ratings and feedback

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Users
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update user profile

### Nurses
- `POST /nurses/profile` - Create nurse profile
- `GET /nurses/approved` - Get approved nurses
- `PATCH /nurses/:id/approve` - Approve nurse (Admin only)

### Bookings
- `POST /bookings` - Create booking (Patient only)
- `GET /bookings/me` - Get user's bookings
- `PATCH /bookings/:id/status` - Update booking status
- `PATCH /bookings/:id/cancel` - Cancel booking

### Payments
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/webhook` - Stripe webhook handler

### Reviews
- `POST /reviews` - Create review (Patient only)
- `GET /reviews/nurse/:nurseId` - Get nurse reviews
- `GET /reviews/nurse/:nurseId/rating` - Get nurse average rating

## Setup Instructions

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### 1. Clone and Install
```bash
cd nursing-backend
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nursing_dev?schema=public"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 3. Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed
```

### 4. Development
```bash
# Start development server
npm run start:dev

# Or with Docker
docker-compose up
```

## Testing the API

### 1. Register a Patient
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"password123","name":"Test Patient"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"password123"}'
```

### 3. Create a Booking
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nurseId":2,"scheduledAt":"2025-12-20T09:00:00.000Z","durationMinutes":60}'
```

### 4. Create Payment Intent
```bash
curl -X POST http://localhost:3000/payments/create-intent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":1}'
```

## Seed Data

The seed script creates:
- Admin user: `admin@local.test` / `adminpass`
- Nurse user: `nurse1@local.test` / `nursepass`
- Patient user: `patient1@local.test` / `patientpass`

## Production Deployment

### 1. Build
```bash
npm run build
```

### 2. Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Environment Variables
Ensure all production environment variables are set:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Security Features

- JWT token authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation with class-validator
- CORS enabled
- Stripe webhook signature verification

## Development Scripts

```bash
npm run start:dev    # Development server
npm run build        # Build for production
npm run start        # Production server
npm run prisma:migrate # Run database migrations
npm run prisma:seed  # Seed database
npm run test         # Run tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.


