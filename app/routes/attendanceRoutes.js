const express = require('express');
const router = express.Router();
const { 
  markAttendance,
  getCourseAttendance,
  getStudentAttendance,
  updateStudentAttendance
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

// Course attendance routes (Teacher)
router.post(
  '/:courseId', 
  authenticate, 
  authorize('teacher'), 
  markAttendance
);
router.get(
  '/:courseId', 
  authenticate, 
  authorize('teacher'), 
  getCourseAttendance
);

// Student attendance routes (Student/Teacher)
router.get(
  '/student/:studentId', 
  authenticate, 
  authorize('student', 'teacher'), 
  getStudentAttendance
);

// Update student attendance for a course (Teacher)
router.put(
  '/:courseId/student/:studentId', 
  authenticate, 
  authorize('teacher'), 
  updateStudentAttendance
);

module.exports = router; 