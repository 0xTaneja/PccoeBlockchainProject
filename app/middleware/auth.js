const jwt = require('jsonwebtoken');
const config = require('../config');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Find user by id and role
    if (decoded.role === 'student') {
      req.user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'teacher') {
      req.user = await Teacher.findById(decoded.id).select('-password');
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.role = decoded.role;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// Middleware to authorize based on role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

// Middleware to check if teacher is a class teacher
exports.isClassTeacher = async (req, res, next) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only class teachers can access this resource'
      });
    }

    const teacher = await Teacher.findById(req.user._id);
    if (!teacher.isClassTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Only class teachers can access this resource'
      });
    }

    next();
  } catch (err) {
    console.error('ClassTeacher authorization error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Middleware to check if teacher is an HOD
exports.isHod = async (req, res, next) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only HODs can access this resource'
      });
    }

    const teacher = await Teacher.findById(req.user._id);
    if (!teacher.isHod) {
      return res.status(403).json({
        success: false,
        message: 'Only HODs can access this resource'
      });
    }

    next();
  } catch (err) {
    console.error('HOD authorization error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 