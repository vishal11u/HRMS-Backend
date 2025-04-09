import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/emailService.js";
import { ValidationError, NotFoundError, AuthenticationError } from "../utils/errors.js";
import { Op } from "sequelize";
import { User } from "../models/user.js";
import Joi from 'joi';

// Validation schemas
const emailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

const validateEmail = (data) => {
  return emailSchema.validate(data);
};

// Password validation schema
const passwordSchema = Joi.object({
  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 30 characters',
      'any.required': 'Password is required'
    })
});

const validatePassword = (data) => {
  return passwordSchema.validate(data);
};

// Helper function to get role ID by name
const getRoleIdByName = async (roleName) => {
  const result = await pool.query(
    "SELECT id FROM roles WHERE LOWER(name) = LOWER($1)",
    [roleName]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError(`Role '${roleName}' not found`);
  }
  
  return result.rows[0].id;
};

export const register = async (req, res, next) => {
  const { username, email, password, role } = req.body;
  
  try {
    // Validate input
    if (!username || !email || !password || !role) {
      throw new ValidationError("All fields are required");
    }
    
    // Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "User with this email or username already exists"
      });
    }
    
    // Get role ID by name
    let role_id;
    try {
      role_id = await getRoleIdByName(role);
    } catch (error) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: `Invalid role: ${role}. Available roles are: Super Admin, Admin, HR Manager, Manager`
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      "INSERT INTO users (username, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role_id",
      [username, email, hashedPassword, role_id]
    );
    
    const newUser = result.rows[0];
    
    // Send welcome email
    await sendWelcomeEmail({
      email: newUser.email,
      username: newUser.username,
      password: password // Send the original password
    });
    
    // Return success response
    res.status(201).json({
      status: "success",
      code: 201,
      message: "User registered successfully",
      data: {
        user: newUser
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  const { emailOrUsername, password } = req.body;
  
  try {
    // Validate input
    if (!emailOrUsername || !password) {
      throw new ValidationError("Email/Username and password are required");
    }
    
    // Find user by email or username
    const result = await pool.query(
      "SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1 OR u.username = $2",
      [emailOrUsername, emailOrUsername]
    ).catch(err => {
      console.error('Database query error:', err);
      throw new Error('Database connection error');
    });
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found"
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Invalid password"
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    // Return success response
    res.status(200).json({
      status: "success",
      code: 200,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role_name
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: err.message || "Something went very wrong!",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    console.log('🔄 Processing password reset request for email:', req.body.email);
    
    const { error } = validateEmail(req.body);
    if (error) {
      console.log('❌ Email validation failed:', error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      console.log('❌ User not found for email:', req.body.email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found, generating reset token');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    console.log('📝 Saving reset token to database');
    await user.update({
      reset_password_token: hashedToken,
      reset_password_expires: Date.now() + 3600000 // 1 hour
    });

    console.log('📧 Attempting to send password reset email');
    const emailSent = await sendPasswordResetEmail(user, resetToken);
    
    if (!emailSent) {
      console.error('❌ Failed to send password reset email');
      return res.status(500).json({ message: 'Error sending password reset email' });
    }

    console.log('✅ Password reset email sent successfully');
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('❌ Error in requestPasswordReset:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = req.query.token;
    console.log('🔄 Processing password reset for token:', token);
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ message: 'Reset token is required' });
    }
    
    const { error } = validatePassword(req.body);
    if (error) {
      console.log('❌ Password validation failed:', error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('🔍 Finding user with reset token');
    const user = await User.findOne({
      where: {
        reset_password_token: hashedToken,
        reset_password_expires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      console.log('❌ Invalid or expired reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    console.log('✅ Valid token found, updating password');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    await user.update({
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    });

    console.log('✅ Password successfully reset');
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('❌ Error in resetPassword:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};