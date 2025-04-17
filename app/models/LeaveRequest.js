const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick', 'Personal', 'Academic', 'Family', 'Other'],
    default: 'Other',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true,
    min: 1
  },
  documentProof: {
    type: String, // Path to uploaded document
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved_by_teacher', 'approved_by_hod', 'rejected'],
    default: 'pending'
  },
  classTeacherApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    approvedAt: Date,
    comments: String
  },
  hodApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    approvedAt: Date,
    comments: String
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  blockchainHash: {
    type: String,
    trim: true
  },
  ipfsDocLink: {
    type: String,
    trim: true
  },
  verificationResult: {
    verified: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      default: 0
    },
    reasoning: {
      type: String,
      default: ''
    },
    recommendedAction: {
      type: String,
      enum: ['approve', 'request_more_info', 'reject'],
      default: 'request_more_info'
    },
    ipfsLink: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
module.exports = LeaveRequest; 