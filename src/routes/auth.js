import express from 'express';
import { 
  register, 
  login, 
  requestPasswordReset, 
  resetPassword,
  verifyToken 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-token', verifyToken);

export default router;
