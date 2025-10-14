# Raffle Draw Backend API

A comprehensive backend API for managing raffle draw events built with Node.js, Express, MySQL, and Sequelize.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Raffle Draw Management**: Create, read, update, and delete raffle draws
- **Prize Management**: Add and manage prizes for raffle draws
- **Participant Management**: Add participants to raffle draws
- **Draw Execution**: Conduct automated raffle draws with winner selection
- **Admin Panel**: Admin users can view all raffle draws and manage users
- **Data Validation**: Comprehensive input validation using express-validator

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   DB_HOST=localhost
   DB_NAME=raffle_draw
   DB_USER=sigmind
   DB_PASS=$!gmind9876!
   ```

4. Make sure your MySQL database is running and create the database:
   ```sql
   CREATE DATABASE raffle_draw;
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

6. Access the API documentation:
   - **Swagger UI:** `http://localhost:5000/api-docs`
   - **Health Check:** `http://localhost:5000/api/health`

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /profile` - Get current user profile

### Raffle Draw Routes (`/api/raffle-draws`)

- `GET /` - Get all raffle draws for authenticated user
- `GET /:id` - Get specific raffle draw
- `POST /` - Create new raffle draw
- `PUT /:id` - Update raffle draw
- `DELETE /:id` - Delete raffle draw
- `POST /:id/prizes` - Add prize to raffle draw
- `POST /:id/participants` - Add participant to raffle draw
- `POST /:id/draw` - Conduct the raffle draw

### Admin Routes (`/api/admin`)

- `GET /raffle-draws` - Get all raffle draws (admin only)
- `GET /raffle-draws/:id` - Get specific raffle draw details (admin only)
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user details (admin only)
- `PUT /users/:id/status` - Update user status (admin only)
- `GET /dashboard` - Get dashboard statistics (admin only)
- `DELETE /raffle-draws/:id` - Delete raffle draw (admin only)

## Database Models

### User
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password` (Hashed)
- `role` (admin/user)
- `firstName`
- `lastName`
- `isActive`
- `createdAt`, `updatedAt`

### RaffleDraw
- `id` (Primary Key)
- `title`
- `description`
- `drawDate`
- `status` (draft/active/completed/cancelled)
- `maxParticipants`
- `userId` (Foreign Key)
- `isPublic`
- `createdAt`, `updatedAt`

### Prize
- `id` (Primary Key)
- `name`
- `description`
- `value`
- `position`
- `raffleDrawId` (Foreign Key)
- `winnerId` (Foreign Key)
- `createdAt`, `updatedAt`

### Participant
- `id` (Primary Key)
- `name`
- `email`
- `phone`
- `ticketNumber` (Unique)
- `raffleDrawId` (Foreign Key)
- `isWinner`
- `prizeId` (Foreign Key)
- `createdAt`, `updatedAt`

## API Documentation

The API includes comprehensive Swagger/OpenAPI documentation that can be accessed at:

**Swagger UI:** `http://localhost:5000/api-docs`

The documentation includes:
- Interactive API explorer
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error codes and descriptions

### Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

You can test the API directly from the Swagger UI by clicking the "Authorize" button and entering your JWT token.

## User Roles

- **admin**: Can view all raffle draws, manage users, and access admin dashboard
- **user**: Can only manage their own raffle draws

## Error Handling

All API responses follow a consistent format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": { ... },
  "error": "Error details (development only)"
}
```

## Development

- Use `npm run dev` for development with auto-restart
- Use `npm start` for production
- The database will be automatically synchronized on startup

## Security Features

- Password hashing using bcryptjs
- JWT token authentication
- Input validation and sanitization
- Role-based access control
- SQL injection protection through Sequelize ORM
