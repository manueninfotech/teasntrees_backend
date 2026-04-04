import express from 'express';
import { getAllCategories } from '../../controllers/manager/categoryController.js';
import { authenticate } from '../../middlewares/auth.js';
import { isManager } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(isManager);

router.get('/', getAllCategories);

export default router;
