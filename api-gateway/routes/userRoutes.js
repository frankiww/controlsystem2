const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {checkRoles} = require('../middleware/checkRoles');

router.get('/', checkRoles(1,2), userController.getAllUsers);
router.get('/:userId', userController.getUser);
router.post('/', userController.createUser);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

module.exports = router;
