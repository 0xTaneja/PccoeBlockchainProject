const express = require('express');
const router = express.Router();
const { 
  createLeaveRequest,
  getStudentLeaveRequests,
  getPendingTeacherLeaveRequests,
  getPendingHodLeaveRequests,
  approveLeaveRequestByTeacher,
  approveLeaveRequestByHod,
  rejectLeaveRequest,
  getLeaveRequestById,
  getTeacherLeaveRequests,
  approveLeaveRequest,
  getAllStudentLeaveRequests
} = require('../controllers/leaveRequestController');
const { authenticate, authorize, isClassTeacher, isHod } = require('../middleware/auth');
const { uploadLeaveDocument } = require('../utils/fileUpload');
const LeaveRequest = require('../models/LeaveRequest');

// Student routes
router.post(
  '/', 
  authenticate, 
  authorize('student'), 
  uploadLeaveDocument.single('documentProof'),
  (req, res, next) => {
    console.log('Received leave request body:', req.body);
    console.log('Received file:', req.file);
    next();
  },
  createLeaveRequest
);
router.get(
  '/', 
  authenticate, 
  authorize('student'), 
  getStudentLeaveRequests
);

// New teacher routes for leave management
router.get(
  '/teacher',
  authenticate,
  authorize('teacher'),
  getTeacherLeaveRequests
);
router.get(
  '/student',
  authenticate,
  authorize('student'),
  getAllStudentLeaveRequests
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

// Generic ID route - should come after specific routes
router.get(
  '/:id',
  authenticate,
  getLeaveRequestById
);

// Approval and rejection routes
router.put(
  '/:id/approve',
  authenticate,
  authorize('teacher'),
  approveLeaveRequest
);
router.put(
  '/:id/reject',
  authenticate,
  authorize('teacher'),
  rejectLeaveRequest
);

module.exports = router; 