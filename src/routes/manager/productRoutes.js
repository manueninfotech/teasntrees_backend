import express from 'express';
import { getProducts, toggleProductAvailability, updateProduct } from '../../controllers/manager/productController.js';
import { authenticate } from '../../middlewares/auth.js';
import { isManager } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(isManager);

router.get('/', getProducts);
router.patch('/:id/availability', toggleProductAvailability);
router.put('/:id', updateProduct); // Allow updating price/details

export default router;
