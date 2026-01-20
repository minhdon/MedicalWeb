import express from 'express';
import { getDashboardStats } from '../controllers/statisticsController.js';

const router = express.Router();

router.get('/dashboard', getDashboardStats);

export default router;
