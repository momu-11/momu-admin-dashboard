# Momu Admin Dashboard

A React-based admin dashboard for managing the Momu app. This dashboard allows administrators to manage users, communities, support requests, and moderate content.

## Features

- **Admin Authentication**: Secure login with email/password
- **User Management**: Browse and manage user accounts
- **Community Management**: Oversee community creation and moderation
- **Support Requests**: Handle user support tickets
- **Content Moderation**: Review and take action on reported content

## Tech Stack

- React 18+ with TypeScript
- Material UI for components and styling
- React Router for navigation
- Supabase for backend authentication and data storage
- Date-fns for date manipulation

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm or yarn package manager
- A Supabase project with the necessary database tables

### Installation

1. Clone the repository
```bash
git clone https://github.com/momu-11/momu-admin-dashboard.git
cd momu-admin-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Configure Supabase
Create a `.env` file in the root directory and add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database (see Database Setup section below)

5. Start the development server
```bash
npm start
```

## Database Setup

The dashboard requires the following tables in your Supabase database:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Communities Table
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',
  members_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Support Requests Table
```sql
CREATE TABLE support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Reports Table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  reported_content_id UUID,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── communities/     # Community management components
│   ├── layout/          # Layout components (header, navigation)
│   ├── reports/         # Report management components
│   ├── support/         # Support request components
│   └── users/           # User management components
├── context/             # React context providers
├── lib/                 # Utility functions and services
├── pages/               # Main application pages
└── types.ts            # TypeScript type definitions
```

## Admin Configuration

Update the admin credentials in `src/context/AuthContext.tsx`:

```typescript
const ADMIN_EMAIL = 'your-admin-email@example.com';
const ADMIN_USER_ID = 'your-admin-user-id';
```

## Design System

- **Theme**: Dark theme with purple accent colors
- **Primary Color**: #9d4eff
- **Secondary Color**: #6a11cb
- **Background**: Linear gradient from #151320 to #4C1B8C

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, please create an issue in the GitHub repository.
