import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP Configuration Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

/**
 * Send a welcome email to a newly registered user
 * @param {Object} user - The user object
 * @param {string} user.email - User's email address
 * @param {string} user.username - User's username
 * @param {string} user.password - User's password (plain text)
 * @returns {Promise} - Resolves when email is sent
 */
export const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Welcome to HRMS - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to HRMS!</h2>
        <p>Hello ${user.username},</p>
        <p>Thank you for registering with our HR Management System. Your account has been successfully created.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">Your Account Details:</h3>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Password:</strong> ${user.password}</p>
        </div>
        
        <p>For security reasons, we recommend changing your password after your first login.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The HRMS Team</p>
      </div>
    `
  };

  try {
    console.log('📧 Attempting to send welcome email to:', user.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return false;
  }
};

/**
 * Send a password reset email
 * @param {Object} user - The user object
 * @param {string} user.email - User's email address
 * @param {string} resetToken - The password reset token
 * @returns {Promise} - Resolves when email is sent
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'HRMS - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #444;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.5; color: #444;">We received a request to reset your password for your HRMS account.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
          <p style="margin-bottom: 15px; color: #495057;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;
                      margin: 10px 0;
                      border: none;
                      cursor: pointer;">
              Reset Password
            </a>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 15px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #007bff; word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
          This link will expire in 1 hour for security reasons.
        </p>
        <p style="font-size: 14px; color: #6c757d;">
          If you did not request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #495057; margin: 0;">Best regards,<br>The HRMS Team</p>
        </div>
      </div>
    `
  };

  try {
    console.log('📧 Attempting to send password reset email to:', user.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return false;
  }
}; 