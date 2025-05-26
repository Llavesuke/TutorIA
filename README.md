# TutorIA - Educational Platform

TutorIA is an educational platform that connects students with virtual tutors powered by AI.

## Features

- Educational center registration with email verification
- User authentication and authorization
- Virtual tutors for different subjects
- Chat interface for student-tutor interaction
- Document management
- And more...

## Running with Docker

The easiest way to run the application is using Docker Compose, which will start both the frontend and backend services.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Starting the Application

1. Clone the repository:
   ```
   git clone <repository-url>
   cd TutorIA
   ```

2. Start the application with Docker Compose:
   ```
   docker-compose up
   ```

   This will start both the frontend and backend services. The first time you run this command, it will build the Docker images, which may take a few minutes.

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Stopping the Application

To stop the application, press `Ctrl+C` in the terminal where Docker Compose is running, or run:
```
docker-compose down
```

## Development

### Frontend

The frontend is built with Vue.js and Vite. To run it locally:

```
cd frontend
npm install
npm run dev
```

### Backend

The backend is built with Express.js. To run it locally:

```
cd backend
npm install
npm run dev
```

## Environment Variables

The application uses environment variables for configuration. These are set in the `.env` files and in the Docker Compose configuration.

### Frontend Environment Variables

- `VITE_SUPABASE_URL`: The URL of your Supabase project
- `VITE_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project
- `VITE_BACKEND_URL`: The URL of the backend API

### Backend Environment Variables

- `DB_CONNECTION_STRING`: PostgreSQL connection string for Supabase
- `PORT`: The port the backend server will listen on
- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_ANON_KEY`: The anonymous key for your Supabase project
- `FRONTEND_URL`: The URL of the frontend application
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image uploads
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `GEMINI_API_KEY`: Google Gemini API key for AI features

## License

[MIT](LICENSE)
