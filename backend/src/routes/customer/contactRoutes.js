import express from 'express';
import { submitContactForm } from '../../controllers/customer/contactController.js';

const router = express.Router({ mergeParams: true });

router.post('/', submitContactForm);

export default router;
