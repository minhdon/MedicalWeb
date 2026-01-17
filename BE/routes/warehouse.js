import express from 'express';
import {
    getAllWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    toggleWarehouseStatus
} from '../controllers/warehouseController.js';

const router = express.Router();

router.get('/getAll', getAllWarehouses);
router.post('/create', createWarehouse);
router.put('/update/:id', updateWarehouse);
router.delete('/delete/:id', deleteWarehouse);
router.patch('/toggle/:id', toggleWarehouseStatus);

export default router;
