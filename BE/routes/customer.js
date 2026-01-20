import express from 'express';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, searchCustomerByPhone, resetCustomerPassword } from '../controllers/customerController.js';

const router = express.Router();

router.get('/getAll', getAllCustomers);
router.get('/search', searchCustomerByPhone); // Search customer by phone for staff in-store sales
router.post('/create', createCustomer);
router.put('/update/:id', updateCustomer);
router.put('/:id/reset-password', resetCustomerPassword); // Reset password for customer
router.delete('/delete/:id', deleteCustomer);

export default router;

