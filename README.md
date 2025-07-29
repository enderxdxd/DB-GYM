# FitnessPro - Complete Fitness Management Platform

A comprehensive fitness platform built with Next.js that allows trainers to create workout programs and users to track their fitness journey.

## 🌟 Features

### For Users
- 🔐 **User Authentication** - Secure login/register with JWT
- 🏋️ **Workout Tracking** - Browse and join fitness programs
- 📊 **Progress Monitoring** - Track workout completion and performance
- 💳 **Subscription Management** - Join/leave programs with payment integration
- 📱 **Responsive Design** - Works seamlessly on all devices

### For Trainers
- 👨‍🏫 **Program Creation** - Design custom workout programs
- 📈 **Analytics Dashboard** - Monitor user engagement and completion rates
- 👥 **User Management** - Track subscribers and their progress
- 🎯 **Performance Insights** - Detailed analytics on program effectiveness

### Admin Features
- 🛠️ **System Management** - Complete platform administration
- 📊 **Advanced Analytics** - Comprehensive insights and reporting
- 👥 **User Management** - Manage all users and trainers
- 🔧 **Configuration** - Platform settings and customization

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Neon Database** - Serverless PostgreSQL
- **JWT Authentication** - Secure token-based auth
- **Middleware** - Request processing and security

### Database
- **PostgreSQL** - Relational database via Neon
- **SQL Queries** - Direct SQL with type safety
- **Migrations** - Database schema management

## 📁 Project Structure

```
my-fitness-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/              # Main application
│   │   │   ├── dashboard/            # Dashboard home
│   │   │   ├── programs/             # Program management
│   │   │   ├── workouts/             # Workout tracking
│   │   │   ├── progress/             # Progress monitoring
│   │   │   ├── nutrition/            # Nutrition tracking
│   │   │   ├── analytics/            # Analytics dashboard
│   │   │   └── admin/                # Admin panel
│   │   └── api/                      # API endpoints
│   │       ├── auth/                 # Authentication APIs
│   │       ├── programs/             # Program management APIs
│   │       ├── workouts/             # Workout APIs
│   │       ├── analytics/            # Analytics APIs
│   │       └── payments/             # Payment processing
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # Base UI components
│   │   ├── auth/                     # Authentication components
│   │   ├── programs/                 # Program-related components
│   │   ├── workouts/                 # Workout components
│   │   └── analytics/                # Analytics components
│   ├── lib/                          # Shared utilities
│   │   ├── auth/                     # Authentication logic
│   │   ├── database/                 # Database configuration
│   │   ├── services/                 # Business logic services
│   │   ├── utils/                    # Helper utilities
│   │   └── hooks/                    # Custom React hooks
│   └── types/                        # TypeScript type definitions
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (we recommend Neon)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/fitness-app.git
cd fitness-app/my-fitness-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL=""

# Payment (Optional)
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
```

### 4. Database Setup
```bash
# Initialize database tables
npm run db:init

# Or visit: http://localhost:3000/api/init-db
```

### 5. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **trainers** - Trainer-specific information
- **programs** - Fitness programs created by trainers
- **workouts** - Individual workouts within programs
- **exercises** - Exercise definitions and instructions
- **exercise_sets** - Set tracking for exercises
- **subscriptions** - User program subscriptions
- **user_progress** - Workout completion tracking
- **payments** - Payment transaction records

### Relationships
```sql
users (1) ←→ (many) subscriptions ←→ (many) programs
programs (1) ←→ (many) workouts ←→ (many) exercises
exercises (1) ←→ (many) exercise_sets
users (1) ←→ (many) user_progress ←→ (many) workouts
```

## 🔐 Authentication & Authorization

### User Roles
- **User** - Can browse and join programs, track workouts
- **Trainer** - Can create programs, view analytics, manage subscribers
- **Admin** - Full system access and management

### Protected Routes
- All `/dashboard/*` routes require authentication
- Trainer routes require `trainer` or `admin` role
- Admin routes require `admin` role

### JWT Token Structure
```json
{
  "userId": "123",
  "email": "user@example.com",
  "role": "user|trainer|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 🎯 API Endpoints

### Authentication
```
POST   /api/auth/login       # User login
POST   /api/auth/register    # User registration
GET    /api/auth/profile     # Get user profile
POST   /api/auth/logout      # User logout
```

### Programs
```
GET    /api/programs              # List all programs
POST   /api/programs              # Create program (trainer)
GET    /api/programs/:id          # Get program details
PUT    /api/programs/:id          # Update program (trainer)
DELETE /api/programs/:id          # Delete program (trainer)
GET    /api/programs/:id/workouts # Get program workouts
```

### Workouts
```
GET    /api/workouts              # List user workouts
POST   /api/workouts              # Create workout
GET    /api/workouts/:id          # Get workout details
PUT    /api/workouts/:id          # Update workout
DELETE /api/workouts/:id          # Delete workout
```

### Subscriptions
```
GET    /api/subscriptions         # User subscriptions
POST   /api/subscriptions         # Subscribe to program
DELETE /api/subscriptions/:id     # Cancel subscription
```

### Analytics
```
GET    /api/analytics/users/completed-programs    # User completion stats
GET    /api/analytics/workouts/completion-rates   # Workout completion rates
GET    /api/analytics/programs/popular           # Popular programs
```

## 🧪 Testing & Debugging

### Debug Mode
```bash
# Run with debugging enabled
npm run dev:debug

# Or with breakpoints
NODE_OPTIONS='--inspect-brk' npm run dev
```

### API Testing
```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Debugging Tools
- Browser DevTools for client-side debugging
- VS Code debugger for server-side debugging
- Console logging throughout the application
- Network tab for API request monitoring

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Build Commands
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📱 Features Deep Dive

### User Dashboard
- **Overview**: Quick stats and recent activity
- **Programs**: Browse available fitness programs
- **My Programs**: Manage active subscriptions
- **Workouts**: Track individual workout sessions
- **Progress**: View completion rates and achievements

### Trainer Dashboard
- **Program Management**: Create and edit fitness programs
- **Analytics**: Monitor user engagement and success rates
- **Subscribers**: Manage program participants
- **Workout Creation**: Design individual workout sessions

### Admin Panel
- **User Management**: Oversee all platform users
- **System Analytics**: Platform-wide insights and metrics
- **Content Moderation**: Review and approve programs
- **Configuration**: System settings and customization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Add proper error handling
- Include appropriate logging
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database Connection Issues**
- Verify `DATABASE_URL` in `.env.local`
- Check Neon database status
- Run `/api/test-db` endpoint

**Authentication Problems**
- Clear localStorage and cookies
- Verify JWT_SECRET configuration
- Check token expiration

**Build Errors**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

### Getting Help
- 📧 Email: support@fitnesspro.com
- 💬 Discord: [FitnessPro Community](https://discord.gg/fitnesspro)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/fitness-app/issues)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Lucide](https://lucide.dev/) - Beautiful & consistent icons
- [Vercel](https://vercel.com/) - Deployment platform

---

Built with ❤️ by the FitnessPro Team
