import express from 'express';
import { getCustomerStatus } from '../../controllers/customer/statusController.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getCustomerStatus);

export default router;
