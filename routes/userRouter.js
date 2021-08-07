const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getOneUser);
router.patch('/:id', userController.updateOneUser);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;
