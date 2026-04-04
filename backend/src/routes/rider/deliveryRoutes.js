import express from 'express';
import upload from '../../middlewares/upload.js';
import {
    getActiveDelivery,
    acceptDelivery,
    rejectDelivery,
    updateDeliveryStatus,
    updateLocation,
    getEarningsHistory,
    uploadDeliveryProof
} from '../../controllers/rider/deliveryController.js';
import { riderAuth, isApprovedRider } from '../../middlewares/riderAuth.js';

const router = express.Router({ mergeParams: true });

// All routes require auth
router.use(riderAuth);
router.use(isApprovedRider);

router.get('/active', getActiveDelivery);
router.post('/:id/accept', acceptDelivery);
router.post('/:id/reject', rejectDelivery);
router.put('/:id/status', updateDeliveryStatus);
router.post('/:id/proof', upload.single('image'), uploadDeliveryProof);
router.put('/location', updateLocation);

router.get('/earnings', getEarningsHistory);

export default router;
