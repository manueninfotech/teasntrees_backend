import express from 'express';
import { getProducts, toggleProductAvailability } from '../../controllers/manager/productController.js';
import { authenticate } from '../../middlewares/auth.js';
import { isManager } from '../../middlewares/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(isManager);

router.get('/', getProducts);
router.patch('/:id/availability', toggleProductAvailability);

export default router;
