const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const {checkRoles} = require('../middleware/checkRoles');


router.get('/', checkRoles(1,2), orderController.getAllOrders);
router.get('/:orderId', orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:orderId', orderController.updateOrder);
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;
