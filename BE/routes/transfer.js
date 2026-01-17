import express from 'express';
import {
    getAllTransfers,
    createTransfer,
    completeTransfer,
    cancelTransfer,
    getTransferStats
} from '../controllers/transferController.js';

const router = express.Router();

// GET /api/transfer/getAll - Get all transfers
router.get('/getAll', getAllTransfers);

// GET /api/transfer/stats - Get transfer statistics
router.get('/stats', getTransferStats);

// POST /api/transfer/create - Create new transfer request
router.post('/create', createTransfer);

// PUT /api/transfer/complete/:id - Complete a pending transfer
router.put('/complete/:id', completeTransfer);

// PUT /api/transfer/cancel/:id - Cancel a pending transfer
router.put('/cancel/:id', cancelTransfer);

export default router;
