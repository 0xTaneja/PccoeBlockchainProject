const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { verifyDocumentHash } = require('../utils/blockchainService');

// Verify a document hash on the blockchain
router.get('/verify/:transactionSignature', authenticate, async (req, res) => {
  try {
    const { transactionSignature } = req.params;
    
    if (!transactionSignature) {
      return res.status(400).json({
        success: false,
        message: 'Transaction signature is required'
      });
    }
    
    const verificationData = await verifyDocumentHash(transactionSignature);
    
    return res.status(200).json({
      success: true,
      data: verificationData
    });
  } catch (error) {
    console.error('Error verifying document hash:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify document hash'
    });
  }
});

module.exports = router; 