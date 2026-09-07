const express = require('express');
const productController = require('../controllers/productController');
const { requireAuth, optionalAuth } = require('../middlewares/auth');
const { upload } = require('../config/upload');

const router = express.Router();

// optionalAuth lets the service show pending/rejected listings to their
// owner or to staff, while anonymous visitors only ever see 'approved'.
router.get('/', optionalAuth, productController.list);
router.get('/:id', productController.getOne);

router.post('/', requireAuth, upload.single('image'), productController.create);
router.patch('/:id', requireAuth, upload.single('image'), productController.update);
router.delete('/:id', requireAuth, productController.remove);

module.exports = router;
