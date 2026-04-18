import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../controllers/customer/wishlistController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// Standard RESTful endpoints (used by Flutter app)
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);

// Legacy/Compatibility endpoints (used by some web frontend components)
router.post('/add', addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);

export default router;
