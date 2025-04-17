/**
 * Configuration module for the Eliza ERP system
 * Loads and validates environment variables
 */

require('dotenv').config();

// Load environment variables with fallbacks
const config = {
  port: process.env.PORT || 3001,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pccoe-erp'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_for_development_only',
    expiresIn: '7d'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretKey: process.env.PINATA_SECRET_KEY
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    privateKey: process.env.SOLANA_PRIVATE_KEY
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    cseId: process.env.GOOGLE_CSE_ID
  },
  env: process.env.NODE_ENV || 'development'
};

// Validate essential configuration
const validateConfig = () => {
  const essentialVars = [
    { key: 'mongodb.uri', value: config.mongodb.uri },
    { key: 'jwt.secret', value: config.jwt.secret },
    { key: 'openai.apiKey', value: config.openai.apiKey }
  ];

  const missingVars = essentialVars.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing essential configuration variables:');
    missingVars.forEach(v => console.warn(`  - ${v.key}`));
    console.warn('The application may not function correctly without these variables.');
  }
  
  // Warn about optional variables if not in production
  if (config.env !== 'production') {
    const optionalVars = [
      { key: 'solana.privateKey', value: config.solana.privateKey, message: 'Blockchain features will use mock data' },
      { key: 'pinata.apiKey', value: config.pinata.apiKey, message: 'IPFS storage will be unavailable' },
      { key: 'google.apiKey', value: config.google.apiKey, message: 'Document verification will use base confidence' }
    ];
    
    const missingOptionalVars = optionalVars.filter(v => !v.value);
    
    if (missingOptionalVars.length > 0) {
      console.warn('ℹ️ Missing optional configuration variables:');
      missingOptionalVars.forEach(v => console.warn(`  - ${v.key}: ${v.message}`));
    }
  }
};

// Run validation
validateConfig();

module.exports = config; 