import express from 'express';
import { getAllMessages, updateMessageStatus, deleteMessage } from '../../controllers/admin/contactController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(checkRole(['admin', 'manager']));

router.get('/', getAllMessages);
router.patch('/:id/status', updateMessageStatus);
router.delete('/:id', deleteMessage);

export default router;
