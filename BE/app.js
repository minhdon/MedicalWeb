import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import { logger, errorHandler } from './middleware/index.js'
import authRoutes from './routes/auth.js'
// Import routes
// import authRoutes from './routes/auth.js'
// import userRoutes from './routes/user.js'
// import adminRoutes from './routes/admin.js'
// import productRoutes from './routes/product.js'

dotenv.config()

const app = express()
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, 
}))
const PORT = process.env.PORT || 3000

// Middleware để parse JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logger middleware
app.use(logger)

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.log('MongoDB connection error:', err))

// Routes
app.get('/', (req, res) => {
  res.send('Hello Luc dz')
});

// Mount auth routes
app.use('/api/auth', authRoutes)

app.use(errorHandler)
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
});
