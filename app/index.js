const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const connectDB = require('./db');
const telegramService = require('./utils/telegramService');
const leaveRequestController = require('./controllers/leaveRequestController');

// Import routes
const authRoutes = require('./routes/authRoutes');
const leaveRequestRoutes = require('./routes/leaveRequestRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PCCOE ERP API is running',
    version: '1.0.0'
  });
});

// Initialize Telegram bot
if (config.telegram.botToken) {
  try {
    telegramService.initBot({
      verifyStudent: leaveRequestController.verifyStudent,
      createLeaveRequest: leaveRequestController.createLeaveRequestFromTelegram,
      getStudentLeaveRequests: async (studentId) => {
        const requests = await leaveRequestController.getStudentLeaveRequests(
          { user: { id: studentId } },
          { status: () => ({ json: (data) => data }) }
        );
        return requests?.data || [];
      },
      approveLeaveRequestByTeacher: async (requestId, teacherId) => {
        await leaveRequestController.approveLeaveRequestByTeacher(
          { user: { id: teacherId }, params: { id: requestId }, body: {} },
          { status: () => ({ json: () => {} }) }
        );
      },
      approveLeaveRequestByHod: async (requestId, hodId) => {
        await leaveRequestController.approveLeaveRequestByHod(
          { user: { id: hodId }, params: { id: requestId }, body: {} },
          { status: () => ({ json: () => {} }) }
        );
      },
      rejectLeaveRequest: async (requestId, teacherId) => {
        await leaveRequestController.rejectLeaveRequest(
          { user: { id: teacherId }, params: { id: requestId }, body: {} },
          { status: () => ({ json: () => {} }) }
        );
      }
    });
    console.log('Telegram bot initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
} else {
  console.warn('Telegram bot token not provided, bot not initialized');
}

// 404 route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle OpenAI API errors
  if (err.name === 'APIError' || (err.message && err.message.includes('OpenAI'))) {
    console.error('OpenAI API Error:', err);
    return res.status(500).json({
      success: false,
      message: 'AI service is currently unavailable. Your request has been processed, but without AI verification.',
      error: err.message
    });
  }
  
  // Handle other errors
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

module.exports = app;
