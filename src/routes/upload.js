import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import upload from '../utils/fileUpload.js';
import {
  uploadProfilePicture,
  uploadDocument,
  getUserDocuments,
  deleteDocument,
  getDocumentCategories
} from '../controllers/uploadController.js';

const router = express.Router();

// Profile picture upload
router.post(
  '/profile',
  verifyToken,
  upload.single('profile'),
  uploadProfilePicture
);

// Document upload
router.post(
  '/document',
  verifyToken,
  upload.single('document'),
  uploadDocument
);

// Get user's documents
router.get(
  '/documents',
  verifyToken,
  getUserDocuments
);

// Delete document
router.delete(
  '/documents/:id',
  verifyToken,
  deleteDocument
);

// Get document categories
router.get(
  '/categories',
  verifyToken,
  getDocumentCategories
);

export default router; 