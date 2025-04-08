const express = require('express');
const router = express.Router();
const { 
  createLeaveRequest,
  getStudentLeaveRequests,
  getPendingTeacherLeaveRequests,
  getPendingHodLeaveRequests,
  approveLeaveRequestByTeacher,
  approveLeaveRequestByHod,
  rejectLeaveRequest
} = require('../controllers/leaveRequestController');
const { authenticate, authorize, isClassTeacher, isHod } = require('../middleware/auth');
const { uploadLeaveDocument } = require('../utils/fileUpload');

// Student routes
router.post(
  '/', 
  authenticate, 
  authorize('student'), 
  uploadLeaveDocument.single('documentProof'),
  createLeaveRequest
);
router.get(
  '/', 
  authenticate, 
  authorize('student'), 
  getStudentLeaveRequests
);

// Teacher routes
router.get(
  '/pending/teacher', 
  authenticate, 
  authorize('teacher'), 
  isClassTeacher,
  getPendingTeacherLeaveRequests
);
router.put(
  '/:id/approve/teacher', 
  authenticate, 
  authorize('teacher'), 
  isClassTeacher,
  approveLeaveRequestByTeacher
);

// HOD routes
router.get(
  '/pending/hod', 
  authenticate, 
  authorize('teacher'), 
  isHod,
  getPendingHodLeaveRequests
);
router.put(
  '/:id/approve/hod', 
  authenticate, 
  authorize('teacher'), 
  isHod,
  approveLeaveRequestByHod
);

// Common teacher/HOD route
router.put(
  '/:id/reject', 
  authenticate, 
  authorize('teacher'), 
  rejectLeaveRequest
);

module.exports = router; 