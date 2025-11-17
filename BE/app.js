import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connect successfully'))
  .catch(err => console.log('Not successfull', err))

