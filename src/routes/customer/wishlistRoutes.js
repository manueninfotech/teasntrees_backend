import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../controllers/customer/wishlistController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);

export default router;
