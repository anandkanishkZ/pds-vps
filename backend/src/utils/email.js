// Simple email utility placeholder
// In production, replace with actual email service (SendGrid, Nodemailer, etc.)

export const sendEmail = async ({ to, subject, html }) => {
  // Log email instead of sending for development
  console.log('📧 Email would be sent:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML:', html);
  
  // In production, implement actual email sending:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransporter({ ... });
  // return transporter.sendMail({ to, subject, html });
  
  return Promise.resolve();
};
