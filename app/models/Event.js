const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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
  venue: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: String,
    required: true,
    trim: true
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  eventType: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Conference', 'Other'],
    required: true
  },
  participants: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    role: {
      type: String,
      trim: true
    },
    certificateIssued: {
      type: Boolean,
      default: false
    }
  }],
  attendanceVerified: {
    type: Boolean,
    default: false
  },
  eventProofDocuments: [{
    type: String // Path to event proof documents
  }]
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event; 