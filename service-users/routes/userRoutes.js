const userController = require('../controllers/userController');
const express = require('express');
const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/by-email/:email', userController.getUserByEmail);
router.get('/health', userController.healthCheck);
router.get('/status', userController.statusCheck);
router.get('/:userId', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

module.exports = router;