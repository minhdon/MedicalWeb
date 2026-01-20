/**
 * Staff Management Routes
 */
import express from 'express';
import {
    getAllStaff,
    getAllRoles,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    resetStaffPassword,
    toggleStaffStatus
} from '../controllers/staffController.js';

const router = express.Router();

// Get all staff members
router.get('/', getAllStaff);

// Get all roles
router.get('/roles', getAllRoles);

// Get staff by ID
router.get('/:id', getStaffById);

// Create new staff
router.post('/', createStaff);

// Update staff
router.put('/:id', updateStaff);

// Delete staff
router.delete('/:id', deleteStaff);

// Reset staff password
router.put('/:id/reset-password', resetStaffPassword);

// Toggle staff active status
router.put('/:id/toggle-status', toggleStaffStatus);

export default router;
