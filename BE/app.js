import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import { logger, errorHandler } from './middleware/index.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/product.js'

dotenv.config()

const app = express()
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
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

import saleInvoiceRoutes from './routes/saleInvoice.js'
import customerRoutes from './routes/customer.js'
// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/product', productRoutes) // Mount product routes
app.use('/api/sale-invoice', saleInvoiceRoutes)
app.use('/api/customer', customerRoutes)

import warehouseRoutes from './routes/warehouse.js'
app.use('/api/warehouse', warehouseRoutes)

import transferRoutes from './routes/transfer.js'
app.use('/api/transfer', transferRoutes)

import paymentRoutes from './routes/payment.js'
app.use('/api/payment', paymentRoutes)

import staffRoutes from './routes/staff.js'
app.use('/api/staff', staffRoutes)

import statisticsRoutes from './routes/statistics.js'
app.use('/api/statistics', statisticsRoutes)

import settingsRoutes from './routes/settings.js'
app.use('/api/settings', settingsRoutes)

app.use(errorHandler)
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
});
