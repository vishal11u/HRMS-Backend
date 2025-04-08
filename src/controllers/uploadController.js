import pool from "../config/db.js";
import fs from 'fs';
import path from 'path';

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const filePath = req.file.path;

    // Update user's profile picture in the database
    const result = await pool.query(
      `UPDATE users 
       SET profile_picture = $1 
       WHERE id = $2 
       RETURNING id, profile_picture`,
      [filePath, userId]
    );

    if (result.rows.length === 0) {
      // Delete uploaded file if user not found
      fs.unlinkSync(filePath);
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profile_picture: result.rows[0].profile_picture
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Error uploading profile picture" });
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, category_id, is_public, expiry_date } = req.body;
    const userId = req.user.id;
    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;

    // Insert document record
    const result = await pool.query(
      `INSERT INTO documents 
       (title, description, file_url, file_type, file_size, category_id, uploaded_by, is_public, expiry_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, title, file_url`,
      [title, description, filePath, fileType, fileSize, category_id, userId, is_public, expiry_date]
    );

    res.status(201).json({
      message: "Document uploaded successfully",
      document: result.rows[0]
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Error uploading document" });
  }
};

// Get user's documents
export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT d.*, dc.name as category_name 
       FROM documents d 
       LEFT JOIN document_categories dc ON d.category_id = dc.id 
       WHERE d.uploaded_by = $1 
       ORDER BY d.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      documents: result.rows
    });
  } catch (error) {
    console.error("Error fetching user documents:", error);
    res.status(500).json({ message: "Error fetching documents" });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if document exists and belongs to user
    const checkResult = await pool.query(
      `SELECT file_url FROM documents WHERE id = $1 AND uploaded_by = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Document not found or unauthorized" });
    }

    // Delete file from filesystem
    const filePath = checkResult.rows[0].file_url;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document record
    await pool.query(
      `DELETE FROM documents WHERE id = $1 AND uploaded_by = $2`,
      [id, userId]
    );

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Error deleting document" });
  }
};

// Get document categories
export const getDocumentCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM document_categories ORDER BY name`
    );

    res.status(200).json({
      categories: result.rows
    });
  } catch (error) {
    console.error("Error fetching document categories:", error);
    res.status(500).json({ message: "Error fetching document categories" });
  }
}; 