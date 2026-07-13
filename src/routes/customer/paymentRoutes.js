import express from 'express';
import { createRazorpayOrder, verifyPayment } from '../../controllers/customer/paymentController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);

export default router;
