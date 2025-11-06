const orderController = require('../controllers/orderController');
const express = require('express');
const router = express.Router();

router.get('/', orderController.getAllOrders);
router.get('/health', orderController.healthCheck);
router.get('/status', orderController.statusCheck);
router.get('/:orderId', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:orderId', orderController.updateOrder);
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;