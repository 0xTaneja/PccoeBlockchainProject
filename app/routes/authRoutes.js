const express = require('express');
const router = express.Router();
const { 
  studentLogin, 
  teacherLogin, 
  getStudentProfile, 
  getTeacherProfile 
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/student/login', studentLogin);
router.post('/teacher/login', teacherLogin);

// Protected routes
router.get('/student/me', authenticate, authorize('student'), getStudentProfile);
router.get('/teacher/me', authenticate, authorize('teacher'), getTeacherProfile);

module.exports = router; 