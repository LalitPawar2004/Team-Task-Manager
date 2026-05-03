# Team Task Manager

A full-stack team task management application built with React, Node.js, Express, and MongoDB.

## Features

- 🔐 User Authentication (Signup/Login with JWT)
- 📁 Project Management (Create, join projects)
- 👥 Role-based Access (Admin & Member)
- ✅ Task Management with Kanban Board
- 📊 Dashboard with Statistics
- 📱 Responsive Design

## Tech Stack

- **Frontend:** React, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Railway

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Environment Variables

Create `backend/.env`:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. Run the application
```bash
# From root directory
npm run dev
```

The app will run on:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Deployment (Railway)

### Prerequisites
- Railway account
- MongoDB Atlas database

### Steps
1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Add environment variables in Railway dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Deploy!

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Projects
- POST `/api/projects` - Create project
- GET `/api/projects` - Get user's projects
- GET `/api/projects/:id` - Get project details
- POST `/api/projects/:id/members` - Add member
- DELETE `/api/projects/:id/members/:userId` - Remove member
- DELETE `/api/projects/:id` - Delete project

### Tasks
- POST `/api/tasks` - Create task
- GET `/api/tasks/project/:projectId` - Get project tasks
- GET `/api/tasks/:id` - Get single task
- PUT `/api/tasks/:id` - Update task
- PATCH `/api/tasks/:id/status` - Update task status
- DELETE `/api/tasks/:id` - Delete task

### Dashboard
- GET `/api/dashboard` - Get dashboard stats

## Project Structure

```
team-task-manager/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```
