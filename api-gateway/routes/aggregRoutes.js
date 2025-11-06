const express = require('express');
const router = express.Router();
const aggregController = require('../controllers/aggregController');

router.get('/:userId/details', aggregController.getUserWithOrders);

module.exports = router;
