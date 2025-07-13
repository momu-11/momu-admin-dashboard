# Momu Admin Dashboard Setup Guide

This guide will help you complete the setup of your Momu Admin Dashboard.

## Prerequisites Completed ✅

- ✅ React app created with TypeScript
- ✅ All dependencies installed (Material UI, Supabase, etc.)
- ✅ GitHub repository created at https://github.com/momu-11/momu-admin-dashboard
- ✅ Supabase CLI initialized
- ✅ Basic project structure created

## Next Steps

### 1. Set up Supabase Project

You need to connect this project to your Supabase project for Momu:

```bash
# Link to your existing Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Or login to Supabase if you haven't already
npx supabase login
```

### 2. Create Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

You can find these values in your Supabase project dashboard:
- Go to https://app.supabase.com/project/YOUR_PROJECT/settings/api
- Copy the URL and anon key

### 3. Set up the Database

Run the database setup script in your Supabase SQL editor:

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy the contents of `database_setup.sql`
3. Paste it into the SQL editor and run it

This will create:
- `users` table
- `communities` table  
- `support_requests` table
- `reports` table
- Sample data for testing
- Proper indexes and security policies

### 4. Configure Admin Access

Update the admin credentials in `src/context/AuthContext.tsx`:

```typescript
const ADMIN_EMAIL = 'your-admin-email@example.com';
const ADMIN_USER_ID = 'your-admin-user-id';
```

Make sure this email exists in your Supabase Auth users.

### 5. Test the Application

```bash
npm start
```

The application should now:
- Connect to your Supabase database
- Allow admin login
- Display the dashboard with proper database connection

### 6. Deploy (Optional)

For production deployment:

```bash
npm run build
```

Then deploy the `build` folder to your hosting provider (Vercel, Netlify, etc.).

## File Structure

```
momu-admin-dashboard/
├── src/
│   ├── components/        # Future admin components
│   ├── context/          # Authentication context
│   ├── lib/              # Supabase client and utilities
│   ├── pages/            # Login and Dashboard pages
│   └── types.ts          # TypeScript definitions
├── database_setup.sql    # Database schema and sample data
├── supabase/            # Supabase CLI configuration
└── README.md            # Project documentation
```

## Available Features

Once setup is complete, you'll have:

- **Secure Admin Login**: Only authorized admins can access
- **User Management**: View and manage user accounts
- **Community Oversight**: Monitor community activities
- **Support System**: Handle user support requests
- **Content Moderation**: Review and act on reports
- **Dark Theme**: Modern purple gradient design

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and anon key in the `.env` file
- Ensure the database tables exist (run `database_setup.sql`)
- Check if Row Level Security policies are properly configured

### Authentication Issues
- Verify admin email/ID in `AuthContext.tsx`
- Ensure the admin user exists in Supabase Auth
- Check browser console for authentication errors

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run build`

## Next Development Steps

The basic structure is ready. You can now:

1. Add more detailed admin components
2. Implement real-time updates using Supabase subscriptions
3. Add more sophisticated user management features
4. Create detailed reporting and analytics
5. Add email notifications for support requests

## Support

- Project Repository: https://github.com/momu-11/momu-admin-dashboard
- Supabase Documentation: https://supabase.com/docs
- Material UI Documentation: https://mui.com/
- React Documentation: https://react.dev/ 