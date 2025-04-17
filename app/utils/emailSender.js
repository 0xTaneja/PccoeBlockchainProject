const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Configure nodemailer transporter
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPass
  }
});

/**
 * Send leave request notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.studentName - Student name
 * @param {string} options.leaveRequestId - Leave request ID
 * @param {string} options.eventName - Event name
 * @param {Date} options.startDate - Leave start date
 * @param {Date} options.endDate - Leave end date
 * @returns {Promise} - Nodemailer response
 */
exports.sendLeaveRequestNotification = async (options) => {
  const { to, subject, studentName, leaveRequestId, eventName, startDate, endDate } = options;
  
  const mailOptions = {
    from: config.emailUser,
    to,
    subject: subject || `Leave Request for Approval - ${studentName}`,
    html: `
      <h2>Leave Request Notification</h2>
      <p>Dear Sir/Madam,</p>
      <p>A new leave request has been submitted for your approval:</p>
      <ul>
        <li><strong>Student Name:</strong> ${studentName}</li>
        <li><strong>Request ID:</strong> ${leaveRequestId}</li>
        <li><strong>Event:</strong> ${eventName}</li>
        <li><strong>Start Date:</strong> ${new Date(startDate).toDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(endDate).toDateString()}</li>
      </ul>
      <p>Please login to the PCCOE ERP system to review and approve/reject this request.</p>
      <p>Regards,<br>PCCOE ERP System</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send leave request status update
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.studentName - Student name
 * @param {string} options.status - Leave request status
 * @param {string} options.eventName - Event name
 * @param {string} options.comments - Comments from approver
 * @returns {Promise} - Nodemailer response
 */
exports.sendLeaveStatusUpdate = async (options) => {
  const { to, studentName, status, eventName, comments } = options;
  
  const statusText = 
    status === 'approved_by_teacher' ? 'Approved by Class Teacher' :
    status === 'approved_by_hod' ? 'Approved by HOD' :
    status === 'rejected' ? 'Rejected' : 'Updated';
  
  const mailOptions = {
    from: config.emailUser,
    to,
    subject: `Leave Request ${statusText} - ${eventName}`,
    html: `
      <h2>Leave Request Status Update</h2>
      <p>Dear ${studentName},</p>
      <p>Your leave request for <strong>${eventName}</strong> has been <strong>${statusText}</strong>.</p>
      ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
      <p>Please check the PCCOE ERP system for more details.</p>
      <p>Regards,<br>PCCOE ERP System</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send attendance update notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.studentName - Student name
 * @param {string} options.courseName - Course name
 * @param {Date} options.date - Attendance date
 * @param {string} options.status - Attendance status
 * @returns {Promise} - Nodemailer response
 */
exports.sendAttendanceUpdate = async (options) => {
  const { to, studentName, courseName, date, status } = options;
  
  const mailOptions = {
    from: config.emailUser,
    to,
    subject: `Attendance Update - ${courseName}`,
    html: `
      <h2>Attendance Update Notification</h2>
      <p>Dear ${studentName},</p>
      <p>Your attendance for <strong>${courseName}</strong> on <strong>${new Date(date).toDateString()}</strong> has been marked as <strong>${status}</strong>.</p>
      <p>Please check the PCCOE ERP system for more details and your current attendance percentage.</p>
      <p>Regards,<br>PCCOE ERP System</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 