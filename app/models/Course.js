const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  credits: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  attendanceSessions: [{
    date: {
      type: Date,
      required: true
    },
    present: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    absent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    excused: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }]
  }]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course; 