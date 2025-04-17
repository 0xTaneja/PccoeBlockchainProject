
# ElizaEdu: AI + Web3 Attendance Verification System (Blockchain)

ElizaEdu is a multi-agent AI system for automated event-based leave approval and ERP attendance updates with blockchain verification.

## Features

- **Student Leave Request Submission**
  - Upload event proof (certificate, invitation) via Telegram or Web UI
  - AI-powered document information extraction
  - Document storage on IPFS (Pinata)
  - Document verification on Solana blockchain

- **Teacher Verification**
  - AI pre-checks document authenticity and student data
  - Teacher receives verification request via Telegram
  - Approval/rejection recorded on blockchain

- **HOD Approval**
  - HOD receives verified documents for final approval
  - Approval signature stored on blockchain
  - Triggers attendance update

- **ERP Update**
  - Automatic attendance record updates
  - Confirmation notifications via Telegram
  - Complete approval history stored in MongoDB and IPFS

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Blockchain**: Solana (JSON RPC)
- **Storage**: IPFS (Pinata)
- **AI**: OpenAI GPT-4 Vision for document analysis
- **Messaging**: Telegram Bot API
- **Frontend**: React with Tailwind CSS

## Architecture

The system is built around 4 Eliza bots:

1. **ElizaRequestBot**: 
   - Extracts information from uploaded documents using AI
   - Uploads documents to IPFS
   - Generates document hash and stores on Solana blockchain

2. **ElizaVerifyBot**:
   - Verifies document information against student data
   - Notifies class teacher via Telegram
   - Records teacher approval on blockchain

3. **ElizaApproveBot**:
   - Manages HOD approval flow
   - Records final signature on blockchain
   - Triggers ERP update

4. **ElizaERPBot**:
   - Updates attendance records in the ERP system
   - Sends confirmation notifications
   - Maintains approval history

## Setup

### Prerequisites

- Node.js v14+
- MongoDB
- Solana account (for blockchain operations)
- Pinata account (for IPFS storage)
- OpenAI API key
- Telegram Bot token

### Environment Variables

Create a `.env` file with the following variables:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pccoe-erp
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_solana_private_key_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### Installation

1. Clone the repository
```
git clone https://github.com/your-username/elizaedu.git
cd elizaedu
```

2. Install dependencies
```
npm install
cd client
npm install
cd ..
```

3. Start the development server
```
npm run dev:full
```

This will start both the backend server and the React frontend.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Leave Requests

- `POST /api/leave-requests` - Create a new leave request
- `GET /api/leave-requests` - Get all leave requests for a student
- `GET /api/leave-requests/pending/teacher` - Get pending teacher leave requests
- `GET /api/leave-requests/pending/hod` - Get pending HOD leave requests
- `PUT /api/leave-requests/:id/approve/teacher` - Approve leave request by teacher
- `PUT /api/leave-requests/:id/approve/hod` - Approve leave request by HOD
- `PUT /api/leave-requests/:id/reject` - Reject leave request

### Blockchain

- `GET /api/blockchain/verify/:transactionSignature` - Verify document hash on blockchain

## Telegram Bot Commands

- `/start` - Start the bot
- `/login` - Login with your student ID
- `/request` - Submit a new leave request
- `/status` - Check status of your leave requests
- `/help` - Show help message

## License

MIT

## Contributors

- Rushab

## Contact

For any inquiries, please contact: sarthak.nimje@pccoepune.org 
>>>>>>> erp/master
