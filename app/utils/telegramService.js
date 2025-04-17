const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

// Initialize Telegram bot
const bot = new Telegraf(config.telegram.botToken);

// Store user to chatId mapping
const userChatMap = new Map();

/**
 * Initialize Telegram bot with commands and handlers
 * @param {Object} controllers - Controllers for handling bot actions
 */
const initBot = (controllers) => {
  // Start command
  bot.start((ctx) => {
    ctx.reply('Welcome to ElizaEdu Bot! 🎓\n\nYou can use this bot to submit leave requests and get updates on approvals.\n\nPlease use /login to connect your account.');
  });
  
  // Help command
  bot.help((ctx) => {
    ctx.reply(
      'ElizaEdu Bot Commands:\n\n' +
      '/start - Start the bot\n' +
      '/login - Login with your student ID\n' +
      '/request - Submit a new leave request\n' +
      '/status - Check status of your leave requests\n' +
      '/help - Show this help message'
    );
  });
  
  // Login command
  bot.command('login', (ctx) => {
    ctx.reply('Please enter your student ID:');
    ctx.session = { waitingForStudentId: true };
  });
  
  // Request command
  bot.command('request', async (ctx) => {
    const chatId = ctx.chat.id;
    const studentId = getUserByChat(chatId);
    
    if (!studentId) {
      ctx.reply('Please login first using the /login command.');
      return;
    }
    
    ctx.reply('Please upload your event document (PDF or image) for the leave request.');
    ctx.session = { waitingForDocument: true };
  });
  
  // Status command
  bot.command('status', async (ctx) => {
    const chatId = ctx.chat.id;
    const studentId = getUserByChat(chatId);
    
    if (!studentId) {
      ctx.reply('Please login first using the /login command.');
      return;
    }
    
    try {
      const leaveRequests = await controllers.getStudentLeaveRequests(studentId);
      
      if (!leaveRequests || leaveRequests.length === 0) {
        ctx.reply('You have no leave requests.');
        return;
      }
      
      let message = 'Your leave requests:\n\n';
      leaveRequests.forEach((request, index) => {
        message += `${index + 1}. Event: ${request.eventName}\n`;
        message += `   Status: ${formatStatus(request.status)}\n`;
        message += `   Date: ${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}\n\n`;
      });
      
      ctx.reply(message);
    } catch (error) {
      console.error('Error getting leave requests:', error);
      ctx.reply('Failed to get leave requests. Please try again later.');
    }
  });
  
  // Handle text messages (for login flow)
  bot.on('text', async (ctx) => {
    if (ctx.session?.waitingForStudentId) {
      const studentId = ctx.message.text.trim();
      
      try {
        const student = await controllers.verifyStudent(studentId);
        
        if (student) {
          registerUser(studentId, ctx.chat.id);
          ctx.reply(`Login successful! Welcome, ${student.name}.`);
        } else {
          ctx.reply('Invalid student ID. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        ctx.reply('Login failed. Please try again later.');
      }
      
      ctx.session = null;
    }
  });
  
  // Handle document uploads
  bot.on(['document', 'photo'], async (ctx) => {
    if (!ctx.session?.waitingForDocument) {
      return;
    }
    
    const chatId = ctx.chat.id;
    const studentId = getUserByChat(chatId);
    
    if (!studentId) {
      ctx.reply('Please login first using the /login command.');
      return;
    }
    
    try {
      // Handle document or photo
      let fileId;
      let fileType;
      
      if (ctx.message.document) {
        fileId = ctx.message.document.file_id;
        fileType = ctx.message.document.mime_type;
      } else if (ctx.message.photo) {
        // Get the highest resolution photo
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        fileId = photo.file_id;
        fileType = 'image/jpeg';
      }
      
      // Get file path from Telegram
      const fileInfo = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${fileInfo.file_path}`;
      
      // Download file
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream'
      });
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate filename with timestamp and extension
      const timestamp = Date.now();
      const fileExt = path.extname(fileInfo.file_path) || `.${fileType.split('/')[1]}`;
      const fileName = `${studentId}_${timestamp}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Save file
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      // Process document when download completes
      writer.on('finish', async () => {
        ctx.reply('Document received. Processing...');
        
        try {
          // Submit leave request with document
          await controllers.createLeaveRequest(studentId, filePath);
          ctx.reply('Leave request submitted successfully! You will be notified when it is reviewed.');
        } catch (error) {
          console.error('Error creating leave request:', error);
          ctx.reply(`Error processing leave request: ${error.message}`);
        }
      });
      
      writer.on('error', (error) => {
        console.error('Error writing file:', error);
        ctx.reply('Error saving document. Please try again.');
      });
    } catch (error) {
      console.error('Error processing document:', error);
      ctx.reply('Error processing document. Please try again.');
    }
    
    ctx.session = null;
  });
  
  // Teacher approval callbacks
  bot.action(/approve_teacher:(.+)/, async (ctx) => {
    const requestId = ctx.match[1];
    const teacherId = getUserByChat(ctx.chat.id);
    
    if (!teacherId) {
      ctx.reply('You are not authorized to approve requests.');
      return;
    }
    
    try {
      await controllers.approveLeaveRequestByTeacher(requestId, teacherId);
      await ctx.answerCbQuery('Request approved!');
      await ctx.editMessageText('You have approved this leave request. ✅');
    } catch (error) {
      console.error('Error approving request:', error);
      await ctx.answerCbQuery('Failed to approve request');
      await ctx.reply(`Error: ${error.message}`);
    }
  });
  
  // HOD approval callbacks
  bot.action(/approve_hod:(.+)/, async (ctx) => {
    const requestId = ctx.match[1];
    const hodId = getUserByChat(ctx.chat.id);
    
    if (!hodId) {
      ctx.reply('You are not authorized to approve requests.');
      return;
    }
    
    try {
      await controllers.approveLeaveRequestByHod(requestId, hodId);
      await ctx.answerCbQuery('Request approved as HOD!');
      await ctx.editMessageText('You have approved this leave request as HOD. ✅');
    } catch (error) {
      console.error('Error approving request:', error);
      await ctx.answerCbQuery('Failed to approve request');
      await ctx.reply(`Error: ${error.message}`);
    }
  });
  
  // Rejection callbacks (for both teacher and HOD)
  bot.action(/reject:(.+)/, async (ctx) => {
    const requestId = ctx.match[1];
    const teacherId = getUserByChat(ctx.chat.id);
    
    if (!teacherId) {
      ctx.reply('You are not authorized to reject requests.');
      return;
    }
    
    try {
      await controllers.rejectLeaveRequest(requestId, teacherId);
      await ctx.answerCbQuery('Request rejected!');
      await ctx.editMessageText('You have rejected this leave request. ❌');
    } catch (error) {
      console.error('Error rejecting request:', error);
      await ctx.answerCbQuery('Failed to reject request');
      await ctx.reply(`Error: ${error.message}`);
    }
  });
  
  // Start the bot
  bot.launch().then(() => {
    console.log('Telegram bot started');
  }).catch(error => {
    console.error('Failed to start Telegram bot:', error);
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

/**
 * Register user to chat ID mapping
 * @param {string} userId - User ID
 * @param {number} chatId - Telegram chat ID
 */
const registerUser = (userId, chatId) => {
  userChatMap.set(userId, chatId);
  userChatMap.set(chatId.toString(), userId);
  console.log(`Registered user ${userId} with chat ${chatId}`);
};

/**
 * Get user ID by chat ID
 * @param {number} chatId - Telegram chat ID
 * @returns {string|null} - User ID or null if not found
 */
const getUserByChat = (chatId) => {
  return userChatMap.get(chatId.toString()) || null;
};

/**
 * Get chat ID by user ID
 * @param {string} userId - User ID
 * @returns {number|null} - Chat ID or null if not found
 */
const getChatByUser = (userId) => {
  return userChatMap.get(userId) || null;
};

/**
 * Send message to user
 * @param {string} userId - User ID
 * @param {string} message - Message to send
 */
const sendMessageToUser = async (userId, message) => {
  const chatId = getChatByUser(userId);
  
  if (!chatId) {
    console.error(`No chat ID found for user ${userId}`);
    return;
  }
  
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
};

/**
 * Send leave request approval message to teacher
 * @param {string} teacherId - Teacher ID
 * @param {Object} leaveRequest - Leave request object
 * @param {Object} student - Student object
 */
const sendTeacherApprovalRequest = async (teacherId, leaveRequest, student) => {
  const chatId = getChatByUser(teacherId);
  
  if (!chatId) {
    console.error(`No chat ID found for teacher ${teacherId}`);
    return;
  }
  
  try {
    const message = `
Leave Request Approval Required ✅

Student: ${student.name} (${student.rollNo})
Event: ${leaveRequest.eventName}
Date: ${new Date(leaveRequest.startDate).toLocaleDateString()} - ${new Date(leaveRequest.endDate).toLocaleDateString()}
Reason: ${leaveRequest.reason}

Document Link: ${leaveRequest.ipfsDocLink || 'Not available'}
`;
    
    await bot.telegram.sendMessage(chatId, message, {
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Approve', `approve_teacher:${leaveRequest._id}`),
          Markup.button.callback('❌ Reject', `reject:${leaveRequest._id}`)
        ]
      ])
    });
  } catch (error) {
    console.error(`Error sending approval request to teacher ${teacherId}:`, error);
  }
};

/**
 * Send leave request approval message to HOD
 * @param {string} hodId - HOD ID
 * @param {Object} leaveRequest - Leave request object
 * @param {Object} student - Student object
 */
const sendHodApprovalRequest = async (hodId, leaveRequest, student) => {
  const chatId = getChatByUser(hodId);
  
  if (!chatId) {
    console.error(`No chat ID found for HOD ${hodId}`);
    return;
  }
  
  try {
    const teacherName = leaveRequest.classTeacherApproval?.approvedBy?.name || 'Unknown Teacher';
    
    const message = `
HOD Approval Required 🔍

Student: ${student.name} (${student.rollNo})
Event: ${leaveRequest.eventName}
Date: ${new Date(leaveRequest.startDate).toLocaleDateString()} - ${new Date(leaveRequest.endDate).toLocaleDateString()}
Reason: ${leaveRequest.reason}

Approved by: ${teacherName}
Document Link: ${leaveRequest.ipfsDocLink || 'Not available'}
Blockchain Verification: ${leaveRequest.blockchainHash ? 'Verified ✓' : 'Not verified ✗'}
`;
    
    await bot.telegram.sendMessage(chatId, message, {
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Approve', `approve_hod:${leaveRequest._id}`),
          Markup.button.callback('❌ Reject', `reject:${leaveRequest._id}`)
        ]
      ])
    });
  } catch (error) {
    console.error(`Error sending approval request to HOD ${hodId}:`, error);
  }
};

/**
 * Format status for display
 * @param {string} status - Status string from database
 * @returns {string} - Formatted status
 */
const formatStatus = (status) => {
  switch (status) {
    case 'pending':
      return '⏳ Pending teacher approval';
    case 'approved_by_teacher':
      return '👨‍🏫 Approved by teacher, waiting for HOD';
    case 'approved_by_hod':
      return '✅ Fully approved';
    case 'rejected':
      return '❌ Rejected';
    default:
      return status;
  }
};

module.exports = {
  initBot,
  registerUser,
  sendMessageToUser,
  sendTeacherApprovalRequest,
  sendHodApprovalRequest
}; 