// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Initialize the Express app
const app = express();

// Middleware
// Enable JSON body parsing for API endpoints
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); 

// Define the port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

// --- Database Connection Function (Next Step) ---
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully using online service!');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1); 
    }
}

// --- Start the Server Function ---
function startServer() {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Step 4: Add your API Routes here 
// --- Define Auth Routes ---
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes); // All endpoints in authRoutes.js start with /api


// 1. Connect to the database
connectDB();

// 2. Start the server once the connection is established (or immediately if using async connect)
// Since mongoose.connect is awaited, the server starts after connection success/failure.
startServer();