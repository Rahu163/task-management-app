Task Management App
Task Management App is a full-stack collaborative task management application that enables teams to manage projects efficiently with real-time updates. Built with React frontend and Node.js/Express backend, it features drag-and-drop task organization, WebSocket integration for instant synchronization, and JWT-based authentication. The application supports three distinct task visibility options (private, user-shared, and team-wide) with a responsive Bootstrap UI, helping teams stay organized and productive while working together on shared projects.

🚀 Key Features
User Authentication: Secure registration/login with JWT tokens and password hashing

Task Management: Full CRUD operations with drag-and-drop between status columns

Real-time Collaboration: Live updates via WebSocket for instant task synchronization

Team Visibility: Three modes: Private, Shared (specific user), and All Team Members

Task Organization: Status columns (To Do, In Progress, Done) with priority levels and deadlines

Team Dashboard: View team members, online status tracking, and task statistics

🔧 Tech Stack
Backend: Node.js, Express, MongoDB, Mongoose, Socket.io, JWT, bcrypt.js
Frontend: React, React Bootstrap, Context API, socket.io-client, Axios
Database: MongoDB with Mongoose schemas
Real-time: Socket.io for bidirectional communication
Authentication: JWT tokens with middleware protection

🚀 Future Implementations
File attachments and task dependencies

Projects & categories with Gantt chart view

Calendar integration and email notifications

Mobile application and offline mode

Advanced permissions and API access

AI task assistant and predictive analytics

🛠️ Installation

# Clone the repository

cd task-management-app

# Backend Setup

cd backend
npm install
cp .env.example .env

# Edit .env with MongoDB URI and JWT secret

npm start

# Frontend Setup (in new terminal)

cd frontend
npm install
npm start
