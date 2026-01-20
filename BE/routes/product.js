import express from 'express';
const router = express.Router();



import { getAllProducts, getProductById, getProductBatches, getAllBatches, createBatch, createBulkBatches, updateBatch, deleteBatch, getBatchesByInvoice, updateBatchGroup, updateProduct } from '../controllers/productController.js';

router.get('/getAll', getAllProducts);
router.get('/batches/getAll', getAllBatches);
router.post('/batches/create', createBatch);
router.post('/batches/bulk-create', createBulkBatches);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);
router.get('/batches/invoice/:invoiceId', getBatchesByInvoice);
router.put('/batches/invoice/:invoiceId', updateBatchGroup);
router.get('/:id/batches', getProductBatches);
router.put('/:id', updateProduct);
router.get('/:id', getProductById);

export default router;
