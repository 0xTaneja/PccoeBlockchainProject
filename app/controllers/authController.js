const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const generateToken = require('../utils/generateToken');

/**
 * Student login controller
 * @route POST /api/auth/student/login
 * @access Public
 */
exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find student by email
    const student = await Student.findOne({ email });
    
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await student.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(student._id, 'student');

    res.json({
      success: true,
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        division: student.division
      }
    });
  } catch (err) {
    console.error('Student login error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Teacher login controller
 * @route POST /api/auth/teacher/login
 * @access Public
 */
exports.teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find teacher by email
    const teacher = await Teacher.findOne({ email });
    
    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await teacher.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(teacher._id, 'teacher');

    res.json({
      success: true,
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId,
        department: teacher.department,
        designation: teacher.designation,
        isClassTeacher: teacher.isClassTeacher,
        isHod: teacher.isHod
      }
    });
  } catch (err) {
    console.error('Teacher login error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get current student profile
 * @route GET /api/auth/student/me
 * @access Private (Student)
 */
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .select('-password')
      .populate('attendance.courseId', 'name courseCode')
      .populate('leaveRequests', 'status startDate endDate reason eventName');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      student
    });
  } catch (err) {
    console.error('Get student profile error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get current teacher profile
 * @route GET /api/auth/teacher/me
 * @access Private (Teacher)
 */
exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user._id)
      .select('-password')
      .populate('courses', 'name courseCode');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      teacher
    });
  } catch (err) {
    console.error('Get teacher profile error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 