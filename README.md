# PCCOE ERP System with ElizaEdu Integration

This repository contains a comprehensive Educational ERP system for Pimpri Chinchwad College of Engineering with ElizaEdu, an AI-powered Web3 system for automated event attendance verification.

## Repository Structure

- `app/` - Backend API built with Node.js and Express
- `client/` - Frontend application built with React
- `research_paper/` - LaTeX files for the ElizaEdu research paper

## System Requirements

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation and Setup

### Clone the repository

```bash
git clone https://github.com/Sarthaknimje/erp.git
cd erp
```

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` file with your MongoDB connection string and other configurations.

3. Seed the database:
```bash
npm run seed
```

4. Start the backend server:
```bash
npm run dev
```
The server will run on http://localhost:3001 by default.

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```
The application will run on http://localhost:3000.

### Running Both Frontend and Backend

To run both the frontend and backend concurrently:
```bash
npm run dev:full
```

## Login Credentials

### Student Login
- Email: student1@pccoe.edu.in
- Password: password123

### Teacher Login
- Email: teacher1@pccoe.edu.in
- Password: password123

### Class Teacher Login
- Email: classteacher1@pccoe.edu.in
- Password: password123

### HOD Login
- Email: hod.computerengineering@pccoe.edu.in
- Password: password123

## API Documentation

API documentation is available in the Postman collection file: `pccoe-erp-api.postman.json`

## ElizaEdu Research Paper

The `research_paper/` directory contains LaTeX source files for the research paper "ElizaEdu: AI-powered Web3 System for Automated, Secure Event Attendance Verification."

### Compiling the Research Paper

1. Install LaTeX on your system or use Overleaf.
2. Compile the diagrams first:
```bash
pdflatex research_paper/system_architecture.tex
pdflatex research_paper/workflow_diagram.tex
```
3. Compile the main paper:
```bash
pdflatex research_paper/ElizaEdu_Paper.tex
```

## Features

- **Authentication System**: Secure login for students, teachers, and administrators
- **Student Dashboard**: View attendance, course information, and submit leave requests
- **Teacher Dashboard**: Manage courses, track student attendance, and approve leave requests
- **Leave Management**: Submit, track, and approve leave requests with document verification
- **ElizaEdu Integration**: AI-powered document verification and blockchain-based approval system

## Technologies Used

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

### Frontend
- React
- Tailwind CSS
- Axios

### ElizaEdu Components
- Ethereum Blockchain
- ElizaOS (AI Agents)
- IPFS

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- Sarthak Nimje
- Rushab Taneja
- Om Baviskar
- Dr. Rachana Patil

## Contact

For any inquiries, please contact: sarthak.nimje@pccoepune.org 