const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const emailSender = require('../utils/emailSender');
const { getFilePath } = require('../utils/fileUpload');
const blockchain = require('../utils/blockchain');
const aiVerification = require('../utils/aiVerification');

/**
 * Create a new leave request
 * @route POST /api/leave-requests
 * @access Private (Student)
 */
exports.createLeaveRequest = async (req, res) => {
  try {
    const {
      reason,
      eventName,
      startDate,
      endDate,
      courseIds
    } = req.body;

    // Get file path from multer
    const documentPath = getFilePath(req);
    
    if (!documentPath) {
      return res.status(400).json({
        success: false,
        message: 'Document proof is required'
      });
    }

    // Verify document using AI
    const documentVerification = aiVerification.verifyDocumentAuthenticity(documentPath);
    
    if (!documentVerification.isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Document appears to be invalid or suspicious',
        verificationDetails: documentVerification
      });
    }

    // Extract event information using AI
    const eventInfo = aiVerification.extractEventInformation(documentPath);

    // Verify student participation using AI
    const participationVerification = aiVerification.verifyStudentParticipation(documentPath, req.user.name);
    
    if (!participationVerification.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify your participation in this event',
        verificationDetails: participationVerification
      });
    }

    // Generate blockchain hash
    const documentHash = blockchain.generateBlockchainHash(documentPath, {
      studentId: req.user._id,
      eventName: eventName || eventInfo.extractedInfo.eventName,
      startDate,
      endDate
    });

    // Store document on blockchain (mock)
    const blockchainTransaction = blockchain.storeDocumentOnBlockchain(documentHash);

    // Store document on IPFS (mock)
    const ipfsHash = blockchain.storeOnIPFS(documentPath);

    // Create leave request
    const leaveRequest = new LeaveRequest({
      student: req.user._id,
      reason,
      eventName: eventName || eventInfo.extractedInfo.eventName,
      startDate,
      endDate,
      documentProof: documentPath,
      courses: courseIds,
      blockchainHash: documentHash,
      ipfsDocLink: ipfsHash
    });

    await leaveRequest.save();

    // Update student's leave requests
    await Student.findByIdAndUpdate(req.user._id, {
      $push: { leaveRequests: leaveRequest._id }
    });

    // Find class teacher to notify
    const student = await Student.findById(req.user._id);
    const classTeacher = await Teacher.findOne({
      isClassTeacher: true,
      classDivision: student.division
    });

    if (classTeacher) {
      // Send email notification to class teacher
      await emailSender.sendLeaveRequestNotification({
        to: classTeacher.email,
        studentName: student.name,
        leaveRequestId: leaveRequest._id,
        eventName: leaveRequest.eventName,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate
      });
    }

    res.status(201).json({
      success: true,
      leaveRequest,
      message: 'Leave request created successfully',
      aiVerification: {
        documentAuthenticity: documentVerification,
        studentParticipation: participationVerification,
        extractedEventInfo: eventInfo
      },
      blockchain: {
        hash: documentHash,
        transaction: blockchainTransaction,
        ipfsLink: ipfsHash
      }
    });
  } catch (err) {
    console.error('Create leave request error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get all leave requests for a student
 * @route GET /api/leave-requests
 * @access Private (Student)
 */
exports.getStudentLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate('courses', 'name courseCode')
      .populate('classTeacherApproval.approvedBy', 'name')
      .populate('hodApproval.approvedBy', 'name');

    res.json({
      success: true,
      count: leaveRequests.length,
      leaveRequests
    });
  } catch (err) {
    console.error('Get student leave requests error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get pending leave requests for class teacher
 * @route GET /api/leave-requests/pending/teacher
 * @access Private (Teacher)
 */
exports.getPendingTeacherLeaveRequests = async (req, res) => {
  try {
    // Get teacher's class division
    const teacher = await Teacher.findById(req.user._id);
    
    if (!teacher.isClassTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Only class teachers can access this resource'
      });
    }

    // Get students in teacher's division
    const students = await Student.find({ division: teacher.classDivision });
    const studentIds = students.map(student => student._id);

    // Get pending leave requests for those students
    const leaveRequests = await LeaveRequest.find({ 
      student: { $in: studentIds },
      status: 'pending'
    })
      .populate('student', 'name studentId email division')
      .populate('courses', 'name courseCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      leaveRequests
    });
  } catch (err) {
    console.error('Get teacher pending leave requests error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get pending leave requests for HOD
 * @route GET /api/leave-requests/pending/hod
 * @access Private (Teacher/HOD)
 */
exports.getPendingHodLeaveRequests = async (req, res) => {
  try {
    // Verify HOD status
    const teacher = await Teacher.findById(req.user._id);
    
    if (!teacher.isHod) {
      return res.status(403).json({
        success: false,
        message: 'Only HODs can access this resource'
      });
    }

    // Get students in HOD's department
    const students = await Student.find({ department: teacher.department });
    const studentIds = students.map(student => student._id);

    // Get leave requests approved by class teacher but not by HOD
    const leaveRequests = await LeaveRequest.find({ 
      student: { $in: studentIds },
      status: 'approved_by_teacher'
    })
      .populate('student', 'name studentId email division department')
      .populate('courses', 'name courseCode')
      .populate('classTeacherApproval.approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      leaveRequests
    });
  } catch (err) {
    console.error('Get HOD pending leave requests error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Approve leave request by class teacher
 * @route PUT /api/leave-requests/:id/approve/teacher
 * @access Private (Teacher)
 */
exports.approveLeaveRequestByTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Find leave request
    const leaveRequest = await LeaveRequest.findById(id)
      .populate('student', 'name email division');
    
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Verify teacher is class teacher for this student
    const teacher = await Teacher.findById(req.user._id);
    
    if (!teacher.isClassTeacher || teacher.classDivision !== leaveRequest.student.division) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this leave request'
      });
    }

    // Update leave request status
    leaveRequest.status = 'approved_by_teacher';
    leaveRequest.classTeacherApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comments: comments || 'Approved'
    };

    await leaveRequest.save();

    // Find HOD to notify
    const hod = await Teacher.findOne({
      isHod: true,
      department: teacher.department
    });

    if (hod) {
      // Send email notification to HOD
      await emailSender.sendLeaveRequestNotification({
        to: hod.email,
        studentName: leaveRequest.student.name,
        leaveRequestId: leaveRequest._id,
        eventName: leaveRequest.eventName,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        subject: 'Leave Request Approved by Class Teacher - Needs HOD Approval'
      });
    }

    // Send email notification to student
    await emailSender.sendLeaveStatusUpdate({
      to: leaveRequest.student.email,
      studentName: leaveRequest.student.name,
      status: 'approved_by_teacher',
      eventName: leaveRequest.eventName,
      comments: comments
    });

    // Store approval on blockchain (mock)
    const approvalHash = blockchain.generateBlockchainHash(`teacher-approval-${id}`, {
      teacherId: req.user._id,
      leaveRequestId: id,
      timestamp: new Date()
    });

    const blockchainTransaction = blockchain.storeDocumentOnBlockchain(approvalHash);

    res.json({
      success: true,
      leaveRequest,
      message: 'Leave request approved by class teacher',
      blockchain: {
        hash: approvalHash,
        transaction: blockchainTransaction
      }
    });
  } catch (err) {
    console.error('Approve leave request by teacher error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Approve leave request by HOD
 * @route PUT /api/leave-requests/:id/approve/hod
 * @access Private (Teacher/HOD)
 */
exports.approveLeaveRequestByHod = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Find leave request
    const leaveRequest = await LeaveRequest.findById(id)
      .populate('student', 'name email')
      .populate('courses');
    
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Verify HOD status
    const teacher = await Teacher.findById(req.user._id);
    
    if (!teacher.isHod) {
      return res.status(403).json({
        success: false,
        message: 'Only HODs can approve this leave request'
      });
    }

    // Check if already approved by class teacher
    if (leaveRequest.status !== 'approved_by_teacher') {
      return res.status(400).json({
        success: false,
        message: 'Leave request must be approved by class teacher first'
      });
    }

    // Update leave request status
    leaveRequest.status = 'approved_by_hod';
    leaveRequest.hodApproval = {
      approved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      comments: comments || 'Approved'
    };

    await leaveRequest.save();

    // Update course attendance records (mark as excused)
    const student = await Student.findById(leaveRequest.student);
    
    // Get dates between start and end date
    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    // Update attendance for each course
    for (const courseId of leaveRequest.courses) {
      const course = await Course.findById(courseId);
      
      // Check each attendance session
      for (const session of course.attendanceSessions) {
        const sessionDate = new Date(session.date);
        
        // Check if session date falls within leave period
        if (sessionDate >= startDate && sessionDate <= endDate) {
          // If student was marked absent, move from absent to excused
          if (session.absent.includes(student._id)) {
            // Remove from absent
            session.absent = session.absent.filter(id => !id.equals(student._id));
            
            // Add to excused if not already there
            if (!session.excused.includes(student._id)) {
              session.excused.push(student._id);
            }
          }
        }
      }
      
      await course.save();
    }

    // Send email notification to student
    await emailSender.sendLeaveStatusUpdate({
      to: leaveRequest.student.email,
      studentName: leaveRequest.student.name,
      status: 'approved_by_hod',
      eventName: leaveRequest.eventName,
      comments: comments
    });

    // Store approval on blockchain (mock)
    const approvalHash = blockchain.generateBlockchainHash(`hod-approval-${id}`, {
      hodId: req.user._id,
      leaveRequestId: id,
      timestamp: new Date()
    });

    const blockchainTransaction = blockchain.storeDocumentOnBlockchain(approvalHash);

    res.json({
      success: true,
      leaveRequest,
      message: 'Leave request approved by HOD and attendance records updated',
      blockchain: {
        hash: approvalHash,
        transaction: blockchainTransaction
      }
    });
  } catch (err) {
    console.error('Approve leave request by HOD error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Reject leave request
 * @route PUT /api/leave-requests/:id/reject
 * @access Private (Teacher)
 */
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, rejectedBy } = req.body;

    // Find leave request
    const leaveRequest = await LeaveRequest.findById(id)
      .populate('student', 'name email');
    
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authority (class teacher or HOD)
    const teacher = await Teacher.findById(req.user._id);
    
    const isClassTeacher = teacher.isClassTeacher;
    const isHod = teacher.isHod;
    
    if (!isClassTeacher && !isHod) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject leave requests'
      });
    }

    // Update leave request status
    leaveRequest.status = 'rejected';
    
    if (rejectedBy === 'teacher' || isClassTeacher) {
      leaveRequest.classTeacherApproval = {
        approved: false,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || 'Rejected'
      };
    } else if (rejectedBy === 'hod' || isHod) {
      leaveRequest.hodApproval = {
        approved: false,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments: comments || 'Rejected'
      };
    }

    await leaveRequest.save();

    // Send email notification to student
    await emailSender.sendLeaveStatusUpdate({
      to: leaveRequest.student.email,
      studentName: leaveRequest.student.name,
      status: 'rejected',
      eventName: leaveRequest.eventName,
      comments: comments
    });

    // Store rejection on blockchain (mock)
    const rejectionHash = blockchain.generateBlockchainHash(`rejection-${id}`, {
      teacherId: req.user._id,
      leaveRequestId: id,
      rejectedBy: rejectedBy || (isClassTeacher ? 'teacher' : 'hod'),
      timestamp: new Date()
    });

    const blockchainTransaction = blockchain.storeDocumentOnBlockchain(rejectionHash);

    res.json({
      success: true,
      leaveRequest,
      message: `Leave request rejected by ${rejectedBy || (isClassTeacher ? 'class teacher' : 'HOD')}`,
      blockchain: {
        hash: rejectionHash,
        transaction: blockchainTransaction
      }
    });
  } catch (err) {
    console.error('Reject leave request error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 