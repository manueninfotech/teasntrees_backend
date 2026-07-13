import express from 'express';
import { getProfile, updateProfile } from '../../controllers/manager/profileController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
// Every other manager sub-router checks the role; this one only authenticated,
// so any signed-in customer or rider could reach the manager profile endpoints.
// It writes name/email/address against the caller's OWN id, so it was not a
// privilege escalation — but it has no business being reachable from a customer
// token.
router.use(checkRole(['manager', 'admin']));

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
