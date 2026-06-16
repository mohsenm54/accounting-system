const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user (admin only)
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', userController.deleteUser);

// Change password
router.post('/:id/change-password', userController.changePassword);

// Get current user profile
router.get('/profile/me', userController.getCurrentUser);

module.exports = router;
