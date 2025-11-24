# 💬 EchoRoom - Real-time Chat Application

A modern, Discord-inspired real-time chat application built with TypeScript, React, Node.js, Express, Socket.IO, and Supabase.

## 📝 Description

EchoRoom is a full-stack real-time chat application that allows multiple users to connect, create servers and rooms, and exchange messages instantly. The application features a clean, intuitive interface inspired by Discord, with support for rich messages, file uploads, voice channels, server management, and more.

## ✨ Features

- 🔐 **Authentication** - Secure user authentication with Supabase Auth
- 💬 **Real-time Messaging** - Instant messaging with Socket.IO
- 🏢 **Servers & Rooms** - Create and manage servers with multiple channels
- 📎 **File Uploads** - Support for images, videos, and other file types
- 🎤 **Voice Channels** - Voice and video chat support
- 📌 **Pinned Messages** - Pin important messages in channels
- 🔔 **Notifications** - Real-time notifications for mentions and messages
- 👥 **Presence System** - Track user online/offline status
- ⚡ **Message Reactions** - React to messages with emojis
- 📊 **Unread Tracking** - Track unread messages per room
- 🎨 **Rich Messages** - Support for markdown, code blocks, and link previews
- 🔗 **Server Invites** - Create and manage server invite links

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Supabase JS Client** - Backend services

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Socket.IO** - Real-time server
- **Supabase** - Database, Auth, Storage
- **Jest** - Testing framework

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn
- **Git**
- A **Supabase** account (free tier available at [supabase.com](https://supabase.com))

## 🚀 Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/vitoriowingert/echoroom.git
cd echoroom
```

### Step 2: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and sign in
   - Click "New Project"
   - Choose your organization and fill in project details
   - Wait for the project to be provisioned

2. **Get Your Supabase Credentials**
   - Go to Project Settings → API
   - Copy the following:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **Anon/Public Key** (starts with `eyJ...`)
     - **Service Role Key** (starts with `eyJ...` - keep this secret!)

3. **Set Up the Database**
   
   Execute the following migrations **in order** in the Supabase SQL Editor:
   
   **Important:** Run migrations sequentially, as each builds upon the previous one.

   ```sql
   -- Migration 001: Initial schema
   -- Run: backend/migrations/001_initial_schema.sql
   
   -- Migration 002: Fix messages delete policy
   -- Run: backend/migrations/002_fix_messages_delete_policy.sql
   
   -- Migration 003: Add servers
   -- Run: backend/migrations/003_add_servers.sql
   
   -- Migration 004: Add presence, notifications, and enhanced features
   -- Run: backend/migrations/004_add_presence_notifications.sql
   
   -- Migration 005: Add file upload support
   -- Run: backend/migrations/005_add_file_uploads.sql
   
   -- Migration 006: Add voice and video chat support
   -- Run: backend/migrations/006_add_voice_video.sql
   
   -- Migration 007: Add server invites system
   -- Run: backend/migrations/007_add_server_invites.sql
   
   -- Migration 008: Add pinned messages support
   -- Run: backend/migrations/008_add_pinned_messages.sql
   ```

   **How to run migrations:**
   - Open your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Copy the contents of each migration file (in order)
   - Paste and click **Run**
   - Verify each migration completes successfully

4. **Set Up Storage Buckets**
   
   After running the migrations, create the following storage buckets in Supabase:
   
   - Go to **Storage** in your Supabase dashboard
   - Create these buckets:
   
   **Bucket: `avatars`**
   - Public: `false`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - Max file size: `5MB`
   
   **Bucket: `server-icons`**
   - Public: `false`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - Max file size: `5MB`
   
   **Bucket: `message-attachments`**
   - Public: `false`
   - Allowed MIME types: `image/*`, `video/*`, `audio/*`, `application/pdf`
   - Max file size: `25MB`
   
   **Storage Policies:**
   
   For each bucket, create the following RLS policies:
   
   **avatars:**
   - **SELECT:** `true` (anyone can view)
   - **INSERT:** `auth.uid()::text = (storage.foldername(name))[1]` (users can upload their own)
   
   **server-icons:**
   - **SELECT:** Check server membership
   - **INSERT:** Check server admin/owner role
   
   **message-attachments:**
   - **SELECT:** Check room membership
   - **INSERT:** Check room membership
   - **DELETE:** Check message ownership

### Step 3: Configure Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your Supabase credentials
```

**Backend `.env` file:**

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Secret (generate a random secret key)
JWT_SECRET=your-random-secret-key-here
```

**Generate JWT Secret:**
```bash
# You can generate a random secret using:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Configure Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your Supabase credentials
```

**Frontend `.env` file:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API URL
VITE_BACKEND_URL=http://localhost:3001
```

### Step 5: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend will be running at: **http://localhost:3001**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be running at: **http://localhost:3000**

### Step 6: Access the Application

Open your browser and navigate to:
👉 **http://localhost:3000**

## 🧪 Testing

Run tests for the backend:

```bash
cd backend

# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Project Structure

```
echoroom/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (Supabase, env)
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── socket/           # Socket.IO event handlers
│   │   ├── middleware/      # Express middlewares (auth, etc)
│   │   ├── __tests__/       # Test files
│   │   ├── index.ts         # Application entry point
│   │   └── server.ts        # Server configuration
│   ├── migrations/          # Database migration files
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_fix_messages_delete_policy.sql
│   │   ├── 003_add_servers.sql
│   │   ├── 004_add_presence_notifications.sql
│   │   ├── 005_add_file_uploads.sql
│   │   ├── 006_add_voice_video.sql
│   │   ├── 007_add_server_invites.sql
│   │   └── 008_add_pinned_messages.sql
│   ├── package.json
│   ├── jest.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── chat/         # Chat components
│   │   │   ├── layout/      # Layout components
│   │   │   └── rooms/       # Room/server components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── config/          # Configuration (Supabase, Socket)
│   │   ├── types/           # TypeScript type definitions
│   │   ├── styles/          # Global styles
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users** - User accounts (managed by Supabase Auth)
- **servers** - Chat servers
- **server_members** - Server membership and roles
- **rooms** - Chat channels/rooms within servers
- **room_members** - Room membership
- **messages** - Chat messages
- **message_attachments** - File attachments
- **message_reactions** - Message emoji reactions
- **pinned_messages** - Pinned messages
- **user_presence** - User online/offline status
- **notifications** - User notifications
- **user_room_reads** - Unread message tracking
- **server_invites** - Server invite links
- **voice_channel_state** - Active voice channels
- **voice_participants** - Voice channel participants

All tables use Row Level Security (RLS) for data protection.

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |
| `SUPABASE_URL` | Your Supabase project URL | **Yes** |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | **Yes** |
| `JWT_SECRET` | Secret key for JWT tokens | **Yes** |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | **Yes** |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | **Yes** |
| `VITE_BACKEND_URL` | Backend API URL | No (default: http://localhost:3001) |

## 📚 Database Migrations

The database setup consists of 8 migrations that must be run in order:

1. **001_initial_schema.sql** - Creates base tables (rooms, messages, room_members)
2. **002_fix_messages_delete_policy.sql** - Fixes message deletion policy
3. **003_add_servers.sql** - Adds server and server_members tables
4. **004_add_presence_notifications.sql** - Adds presence, notifications, reactions, and unread tracking
5. **005_add_file_uploads.sql** - Adds file upload support and storage configuration
6. **006_add_voice_video.sql** - Adds voice and video chat support
7. **007_add_server_invites.sql** - Adds server invite system
8. **008_add_pinned_messages.sql** - Adds pinned messages support

**Migration Instructions:**

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of each migration file (starting with 001)
3. Paste into SQL Editor and click "Run"
4. Verify success before proceeding to next migration
5. Repeat for all 8 migrations

## 🚢 Deployment

### Backend Deployment

The backend can be deployed to platforms like:
- **Railway**
- **Render**
- **Heroku**
- **DigitalOcean App Platform**

Set the same environment variables as in your `.env` file.

### Frontend Deployment

The frontend can be deployed to:
- **Vercel** (recommended for Vite)
- **Netlify**
- **GitHub Pages**

Update `VITE_BACKEND_URL` to point to your deployed backend URL.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Vitório Eugênio Settin Wingert**

- GitHub: [@vitoriowingert](https://github.com/vitoriowingert)

## 🙏 Acknowledgments

- Inspired by Discord's user interface and functionality
- Built with modern web technologies
- Powered by Supabase for backend services

---

## 📝 Additional Notes

### Troubleshooting

**Database connection issues:**
- Verify your Supabase credentials are correct
- Check that all migrations have been run successfully
- Ensure RLS policies are properly configured

**Socket.IO connection issues:**
- Verify backend is running on the correct port
- Check CORS configuration in backend
- Ensure `VITE_BACKEND_URL` matches your backend URL

**File upload issues:**
- Verify storage buckets are created in Supabase
- Check storage bucket policies
- Verify file size limits are appropriate

### Security Notes

- Never commit `.env` files to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET` secure
- Use environment variables for all sensitive data
- Regularly update dependencies for security patches
