# Raffle Draw Frontend

A modern React application for managing and conducting raffle draw events.

## Features

- **User Authentication**: Login and registration system
- **Admin Dashboard**: View all raffle draws and users across the platform
- **User Dashboard**: Create and manage personal raffle draws
- **Step-by-Step Draws**: Conduct raffle draws one prize at a time
- **Real-time Status**: Track draw progress and remaining prizes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Toastify**: Toast notifications
- **Lucide React**: Beautiful icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.js       # Main layout with sidebar
│   └── ProtectedRoute.js # Route protection
├── contexts/           # React contexts
│   └── AuthContext.js # Authentication context
├── pages/             # Page components
│   ├── Login.js       # Login page
│   ├── Register.js    # Registration page
│   ├── UserDashboard.js # User dashboard
│   ├── AdminDashboard.js # Admin dashboard
│   └── RaffleDraw.js  # Raffle draw interface
├── services/          # API services
│   └── api.js        # API client and endpoints
├── App.js            # Main app component
├── index.js          # App entry point
└── index.css         # Global styles
```

## Key Features

### Authentication
- Secure JWT-based authentication
- Protected routes
- Automatic token refresh
- Login/logout functionality

### User Dashboard
- Create new raffle draws
- View all personal raffle draws
- Manage raffle draw settings
- Delete raffle draws

### Admin Dashboard
- View all raffle draws across users
- User management
- System statistics
- Activity monitoring

### Raffle Draw Interface
- **Step-by-Step Drawing**: Draw winners one prize at a time
- **Bulk Drawing**: Draw all winners at once
- **Real-time Status**: See current draw progress
- **Reset Functionality**: Clear all winners to restart
- **Prize Management**: View all prizes and their winners
- **Participant Management**: View all participants and their status

### Step-by-Step Draw Process

1. **Check Status**: View current draw progress
2. **Draw Individual Prizes**: Click "Draw Winner" for each prize
3. **Track Progress**: See which prizes have been drawn
4. **Reset if Needed**: Clear all winners to restart

## API Integration

The frontend integrates with the backend API endpoints:

- **Authentication**: `/api/auth/*`
- **Raffle Draws**: `/api/raffle-draws/*`
- **Admin**: `/api/admin/*`

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App

### Code Style

- ESLint configuration included
- Prettier formatting
- Component-based architecture
- Hooks-based React patterns

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service

3. Ensure the backend API is accessible from your frontend domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
