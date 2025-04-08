const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create uploads directory
const uploadsDir = path.join(__dirname, '../../uploads');
createDirIfNotExists(uploadsDir);
createDirIfNotExists(path.join(uploadsDir, 'documents'));
createDirIfNotExists(path.join(uploadsDir, 'events'));

// Configure storage for leave request documents
const leaveDocumentStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(uploadsDir, 'documents'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leave-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for event proof documents
const eventDocumentStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(uploadsDir, 'events'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only pdf, doc, docx, jpg, jpeg, and png files
  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

// Initialize multer upload for leave documents
exports.uploadLeaveDocument = multer({
  storage: leaveDocumentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize multer upload for event documents
exports.uploadEventDocument = multer({
  storage: eventDocumentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Utility function to get file path from request
exports.getFilePath = (req) => {
  if (!req.file) return null;
  return req.file.path;
};

// Utility function to get multiple file paths from request
exports.getFilePaths = (req) => {
  if (!req.files || req.files.length === 0) return [];
  return req.files.map(file => file.path);
}; 