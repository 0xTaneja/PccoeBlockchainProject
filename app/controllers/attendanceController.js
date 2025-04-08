const Course = require('../models/Course');
const Student = require('../models/Student');
const emailSender = require('../utils/emailSender');
const blockchain = require('../utils/blockchain');

/**
 * Mark attendance for a course
 * @route POST /api/attendance/:courseId
 * @access Private (Teacher)
 */
exports.markAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, presentStudentIds, absentStudentIds } = req.body;

    // Find course
    const course = await Course.findById(courseId)
      .populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if teacher is authorized to mark attendance for this course
    if (!course.teachers.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this course'
      });
    }

    // Check if attendance for this date already exists
    const attendanceDate = new Date(date);
    const existingSession = course.attendanceSessions.find(
      session => new Date(session.date).toDateString() === attendanceDate.toDateString()
    );

    if (existingSession) {
      // Update existing session
      existingSession.present = presentStudentIds;
      existingSession.absent = absentStudentIds;
      // Keep excused students as is
    } else {
      // Create new attendance session
      course.attendanceSessions.push({
        date: attendanceDate,
        present: presentStudentIds,
        absent: absentStudentIds,
        excused: []
      });
    }

    await course.save();

    // Update attendance counts for each student
    for (const studentId of [...presentStudentIds, ...absentStudentIds]) {
      const student = await Student.findById(studentId);
      
      if (student) {
        // Find course in student's attendance array
        const courseAttendance = student.attendance.find(
          a => a.courseId.toString() === courseId
        );

        if (courseAttendance) {
          // Update existing attendance record
          if (presentStudentIds.includes(studentId)) {
            courseAttendance.present += 1;
          } else if (absentStudentIds.includes(studentId)) {
            courseAttendance.absent += 1;
          }
          courseAttendance.total += 1;
        } else {
          // Create new attendance record
          student.attendance.push({
            courseId,
            present: presentStudentIds.includes(studentId) ? 1 : 0,
            absent: absentStudentIds.includes(studentId) ? 1 : 0,
            excused: 0,
            total: 1
          });
        }

        await student.save();

        // Send email notification to student
        if (absentStudentIds.includes(studentId)) {
          await emailSender.sendAttendanceUpdate({
            to: student.email,
            studentName: student.name,
            courseName: course.name,
            date: attendanceDate,
            status: 'absent'
          });
        }
      }
    }

    // Store attendance on blockchain (mock)
    const attendanceHash = blockchain.generateBlockchainHash(`attendance-${courseId}-${date}`, {
      courseId,
      date: attendanceDate,
      teacherId: req.user._id,
      presentCount: presentStudentIds.length,
      absentCount: absentStudentIds.length,
      timestamp: new Date()
    });

    const blockchainTransaction = blockchain.storeDocumentOnBlockchain(attendanceHash);

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendanceSession: course.attendanceSessions.find(
        session => new Date(session.date).toDateString() === attendanceDate.toDateString()
      ),
      blockchain: {
        hash: attendanceHash,
        transaction: blockchainTransaction
      }
    });
  } catch (err) {
    console.error('Mark attendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get attendance for a course
 * @route GET /api/attendance/:courseId
 * @access Private (Teacher)
 */
exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    // Find course
    const course = await Course.findById(courseId)
      .populate('students', 'name studentId email rollNumber')
      .populate('teachers', 'name');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Filter attendance sessions by date range if provided
    let attendanceSessions = course.attendanceSessions;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      attendanceSessions = attendanceSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= start && sessionDate <= end;
      });
    }

    // Calculate attendance statistics
    const attendanceStats = course.students.map(student => {
      const studentId = student._id;
      
      // Count present, absent, and excused for this student
      let presentCount = 0;
      let absentCount = 0;
      let excusedCount = 0;
      
      attendanceSessions.forEach(session => {
        if (session.present.includes(studentId)) {
          presentCount++;
        } else if (session.absent.includes(studentId)) {
          absentCount++;
        } else if (session.excused.includes(studentId)) {
          excusedCount++;
        }
      });
      
      const totalSessions = attendanceSessions.length;
      const attendancePercentage = totalSessions === 0 ? 0 : 
        ((presentCount + excusedCount) / totalSessions) * 100;
      
      return {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          email: student.email,
          rollNumber: student.rollNumber
        },
        presentCount,
        absentCount,
        excusedCount,
        totalSessions,
        attendancePercentage: attendancePercentage.toFixed(2)
      };
    });

    res.json({
      success: true,
      course: {
        _id: course._id,
        name: course.name,
        courseCode: course.courseCode,
        department: course.department,
        teachers: course.teachers
      },
      attendanceSessions,
      attendanceStats,
      totalSessions: attendanceSessions.length
    });
  } catch (err) {
    console.error('Get course attendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get attendance for a student
 * @route GET /api/attendance/student/:studentId
 * @access Private (Student/Teacher)
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check authorization (student can only view their own attendance)
    if (req.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this student\'s attendance'
      });
    }

    // Find student
    const student = await Student.findById(studentId)
      .select('-password')
      .populate('attendance.courseId', 'name courseCode department');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all courses
    const courseIds = student.attendance.map(a => a.courseId._id);
    const courses = await Course.find({ _id: { $in: courseIds } });

    // Prepare detailed attendance data
    const attendanceData = await Promise.all(
      student.attendance.map(async (att) => {
        const course = courses.find(c => c._id.toString() === att.courseId._id.toString());
        
        if (!course) return null;
        
        // Get attendance sessions for this student
        const sessions = course.attendanceSessions.map(session => {
          let status = 'absent';
          
          if (session.present.includes(student._id)) {
            status = 'present';
          } else if (session.excused.includes(student._id)) {
            status = 'excused';
          }
          
          return {
            date: session.date,
            status
          };
        });
        
        const attendancePercentage = att.total === 0 ? 0 : 
          ((att.present + att.excused) / att.total) * 100;
        
        return {
          course: {
            _id: att.courseId._id,
            name: att.courseId.name,
            courseCode: att.courseId.courseCode,
            department: att.courseId.department
          },
          attendance: {
            present: att.present,
            absent: att.absent,
            excused: att.excused,
            total: att.total,
            percentage: attendancePercentage.toFixed(2)
          },
          sessions
        };
      })
    );

    // Filter out null values (from courses that might have been deleted)
    const filteredAttendanceData = attendanceData.filter(data => data !== null);

    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        department: student.department,
        year: student.year,
        division: student.division
      },
      attendance: filteredAttendanceData
    });
  } catch (err) {
    console.error('Get student attendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update attendance status for a student
 * @route PUT /api/attendance/:courseId/student/:studentId
 * @access Private (Teacher)
 */
exports.updateStudentAttendance = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const { date, status } = req.body;

    // Find course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if teacher is authorized to update attendance for this course
    if (!course.teachers.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update attendance for this course'
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find attendance session
    const attendanceDate = new Date(date);
    const sessionIndex = course.attendanceSessions.findIndex(
      session => new Date(session.date).toDateString() === attendanceDate.toDateString()
    );
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found for the specified date'
      });
    }

    const session = course.attendanceSessions[sessionIndex];

    // Update attendance status
    // Remove student from all status arrays first
    session.present = session.present.filter(id => !id.equals(studentId));
    session.absent = session.absent.filter(id => !id.equals(studentId));
    session.excused = session.excused.filter(id => !id.equals(studentId));

    // Add student to the appropriate status array
    if (status === 'present') {
      session.present.push(studentId);
    } else if (status === 'absent') {
      session.absent.push(studentId);
    } else if (status === 'excused') {
      session.excused.push(studentId);
    }

    await course.save();

    // Update student's attendance record
    const studentAttendance = student.attendance.find(
      a => a.courseId.toString() === courseId
    );

    if (studentAttendance) {
      // Reset counts
      studentAttendance.present = 0;
      studentAttendance.absent = 0;
      studentAttendance.excused = 0;
      
      // Count all attendance sessions for this course
      course.attendanceSessions.forEach(sess => {
        if (sess.present.includes(studentId)) {
          studentAttendance.present += 1;
        } else if (sess.absent.includes(studentId)) {
          studentAttendance.absent += 1;
        } else if (sess.excused.includes(studentId)) {
          studentAttendance.excused += 1;
        }
      });
      
      await student.save();
    }

    // Send email notification to student
    await emailSender.sendAttendanceUpdate({
      to: student.email,
      studentName: student.name,
      courseName: course.name,
      date: attendanceDate,
      status
    });

    // Store attendance update on blockchain (mock)
    const updateHash = blockchain.generateBlockchainHash(`attendance-update-${courseId}-${studentId}-${date}`, {
      courseId,
      studentId,
      date: attendanceDate,
      status,
      teacherId: req.user._id,
      timestamp: new Date()
    });

    const blockchainTransaction = blockchain.storeDocumentOnBlockchain(updateHash);

    res.json({
      success: true,
      message: `Student attendance updated to ${status}`,
      session: course.attendanceSessions[sessionIndex],
      blockchain: {
        hash: updateHash,
        transaction: blockchainTransaction
      }
    });
  } catch (err) {
    console.error('Update student attendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 