import express from 'express';
import { getProfile, updateProfile } from '../../controllers/manager/profileController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
