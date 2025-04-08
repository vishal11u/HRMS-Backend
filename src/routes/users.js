import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, getUserProfile);

// Update user profile
router.put('/profile', verifyToken, updateUserProfile);

export default router; 