import express from 'express';
import { registerDevice, listDevices, ingestData, deleteDevice, listMyDevices, controlDevice } from '../controllers/devicesController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Register device (admin only)
router.post('/register', protect, authorize('admin'), registerDevice);
router.get('/', protect, authorize('admin'), listDevices);
router.delete('/:id', protect, authorize('admin'), deleteDevice);

// Devices for authenticated user (admin sees all)
router.get('/my', protect, listMyDevices);

// Public ingest endpoint for devices
router.post('/ingest', ingestData);

// Control device - admin + technician
router.post('/:id/control', protect, authorize('admin','technician'), controlDevice);

export default router;
