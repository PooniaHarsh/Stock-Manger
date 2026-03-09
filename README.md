# Stock Manager

A full-stack stock and sales management application with a React frontend and Node.js/Express backend.

## Project Structure

- `client/` - React + Vite frontend
- `server/` - Express backend with MongoDB models and routes
- `Images/` - Project images/assets

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth

## Prerequisites

- Node.js (v18+ recommended)
- npm
- MongoDB connection string

## Environment Setup

Create a `.env` file in `server/` with your values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Install Dependencies

```bash
cd client && npm install
cd ../server && npm install
```

## Run the App

Start backend:

```bash
cd server
npm run dev
```

Start frontend (in a second terminal):

```bash
cd client
npm run dev
```

## Default URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Available Features

- Authentication
- Dashboard and reports
- Stock management
- Sales management
- Barcode scanner support

## Notes

- Ensure backend is running before using frontend API features.
- Update API base URL in `client/src/api/axios.js` if needed.
